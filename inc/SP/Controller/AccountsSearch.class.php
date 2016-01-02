<?php
/**
 * sysPass
 *
 * @author    nuxsmin
 * @link      http://syspass.org
 * @copyright 2012-2015 Rubén Domínguez nuxsmin@syspass.org
 *
 * This file is part of sysPass.
 *
 * sysPass is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * sysPass is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with sysPass.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace SP\Controller;

defined('APP_ROOT') || die(_('No es posible acceder directamente a este archivo'));

use SP\Account\Account;
use SP\Account\AccountFavorites;
use SP\Account\AccountSearch;
use SP\Config\Config;
use SP\Core\Acl;
use SP\Core\ActionsInterface;
use SP\Core\Session;
use SP\Core\SessionUtil;
use SP\Account\UserAccounts;
use SP\Core\Template;
use SP\Html\DataGrid\DataGrid;
use SP\Html\DataGrid\DataGridAction;
use SP\Html\DataGrid\DataGridActionType;
use SP\Html\DataGrid\DataGridData;
use SP\Html\DataGrid\DataGridHeaderSort;
use SP\Html\DataGrid\DataGridPager;
use SP\Html\DataGrid\DataGridSort;
use SP\Http\Request;
use SP\Mgmt\User\Groups;
use SP\Storage\DBUtil;
use SP\Util\Checks;

/**
 * Clase encargada de obtener los datos para presentar la búsqueda
 *
 * @package Controller
 */
class AccountsSearch extends Controller implements ActionsInterface
{
    /**
     * @var Icons
     */
    private $_icons;
    /**
     * Indica si el filtrado de cuentas está activo
     *
     * @var bool
     */
    private $_filterOn = false;
    /**
     * Colores para resaltar las cuentas
     *
     * @var array
     */
    private $_colors = array(
        '2196F3',
        '03A9F4',
        '00BCD4',
        '009688',
        '4CAF50',
        '8BC34A',
        'CDDC39',
        'FFC107',
        '795548',
        '607D8B',
        '9E9E9E',
        'FF5722',
        'F44336',
        'E91E63',
        '9C27B0',
        '673AB7',
        '3F51B5',
    );

    /** @var string */
    private $_sk = '';
    /** @var int */
    private $_sortKey = 0;
    /** @var string */
    private $_sortOrder = 0;
    /** @var bool */
    private $_searchGlobal = false;
    /** @var int */
    private $_limitStart = 0;
    /** @var int */
    private $_limitCount = 0;
    /** @var int */
    private $_queryTimeStart = 0;
    /** @var bool */
    private $_isAjax = false;

    /**
     * Constructor
     *
     * @param $template Template con instancia de plantilla
     */
    public function __construct(Template $template = null)
    {
        parent::__construct($template);

        $this->_queryTimeStart = microtime();
        $this->_sk = SessionUtil::getSessionKey(true);
        $this->view->assign('sk', $this->_sk);
        $this->setVars();
        $this->_icons = new Icons();
    }

    /**
     * Establecer las variables necesarias para las plantillas
     */
    private function setVars()
    {
        $this->view->assign('isAdmin', (Session::getUserIsAdminApp() || Session::getUserIsAdminAcc()));
        $this->view->assign('showGlobalSearch', Config::getValue('globalsearch', false));

        // Comprobar si está creado el objeto de búsqueda en la sesión
        if (!is_object(Session::getSearchFilters())) {
            Session::setSearchFilters(new AccountSearch());
        }

        // Obtener el filtro de búsqueda desde la sesión
        $filters = Session::getSearchFilters();

        $this->_sortKey = Request::analyze('skey', $filters->getSortKey());
        $this->_sortOrder = Request::analyze('sorder', $filters->getSortOrder());
        $this->_searchGlobal = Request::analyze('gsearch', $filters->getGlobalSearch());
        $this->_limitStart = Request::analyze('start', $filters->getLimitStart());
        $this->_limitCount = Request::analyze('rpp', $filters->getLimitCount());

        // Valores POST
        $this->view->assign('searchCustomer', Request::analyze('customer', $filters->getCustomerId()));
        $this->view->assign('searchCategory', Request::analyze('category', $filters->getCategoryId()));
        $this->view->assign('searchTxt', Request::analyze('search', $filters->getTxtSearch()));
        $this->view->assign('searchGlobal', Request::analyze('gsearch', $filters->getGlobalSearch()));
        $this->view->assign('searchFavorites', Request::analyze('searchfav', $filters->isSearchFavorites()));
    }

    /**
     * @param boolean $isAjax
     */
    public function setIsAjax($isAjax)
    {
        $this->_isAjax = $isAjax;
    }

    /**
     * Obtener los datos para la caja de búsqueda
     */
    public function getSearchBox()
    {
        $this->view->addTemplate('searchbox');

        $this->view->assign('customers', DBUtil::getValuesForSelect('customers', 'customer_id', 'customer_name'));
        $this->view->assign('categories', DBUtil::getValuesForSelect('categories', 'category_id', 'category_name'));
    }

    /**
     * Obtener los resultados de una búsqueda
     */
    public function getSearch()
    {
        $this->view->addTemplate('datasearch-grid');

        $this->view->assign('isAjax', $this->_isAjax);

        $search = new AccountSearch();

        $search->setGlobalSearch($this->_searchGlobal);
        $search->setSortKey($this->_sortKey);
        $search->setSortOrder($this->_sortOrder);
        $search->setLimitStart($this->_limitStart);
        $search->setLimitCount($this->_limitCount);

        $search->setTxtSearch($this->view->searchTxt);
        $search->setCategoryId($this->view->searchCategory);
        $search->setCustomerId($this->view->searchCustomer);
        $search->setSearchFavorites($this->view->searchFavorites);

        $resQuery = $search->getAccounts();

        $this->_filterOn = ($this->_sortKey > 1
            || $this->view->searchCustomer
            || $this->view->searchCategory
            || $this->view->searchTxt
            || $this->view->searchFavorites
            || $search->isSortViews());

        if (!$resQuery) {
            $data = array();
        } else {
            $data = $this->processSearchResults($resQuery);
        }

        $Grid = $this->getGrid();
        $Grid->getData()->setData($data);
        $Grid->updatePager();
        $Grid->setTime(round(microtime() - $this->_queryTimeStart, 5));

        $this->view->assign('data', $Grid);
    }

    /**
     * Procesar los resultados de la búsqueda y crear la variable que contiene los datos de cada cuenta
     * a mostrar.
     *
     * @param &$results array Con los resultados de la búsqueda
     * @return array
     */
    private function processSearchResults(&$results)
    {
        AccountsSearchData::$accountLink = Session::getUserPreferences()->isAccountLink();
        AccountsSearchData::$topNavbar = Session::getUserPreferences()->isTopNavbar();
        AccountsSearchData::$optionalActions = Session::getUserPreferences()->isOptionalActions();
        AccountsSearchData::$requestEnabled = Checks::mailrequestIsEnabled();
        AccountsSearchData::$wikiEnabled = Checks::wikiIsEnabled();
        AccountsSearchData::$dokuWikiEnabled = Checks::dokuWikiIsEnabled();
        AccountsSearchData::$isDemoMode = Checks::demoIsEnabled();

        // Variables de configuración
        $maxTextLength = (Checks::resultsCardsIsEnabled()) ? 40 : 60;

        if (AccountsSearchData::$wikiEnabled) {
            $wikiSearchUrl = Config::getValue('wiki_searchurl', false);
            $this->view->assign('wikiFilter', strtr(Config::getValue('wiki_filter'), ',', '|'));
            $this->view->assign('wikiPageUrl', Config::getValue('wiki_pageurl'));
        }

        $favorites = AccountFavorites::getFavorites(Session::getUserId());

        $Account = new Account();
        $accountsData['count'] = AccountSearch::$queryNumRows;

        foreach ($results as $account) {
            $Account->setAccountId($account->account_id);
            $Account->setAccountUserId($account->account_userId);
            $Account->setAccountUserGroupId($account->account_userGroupId);
            $Account->setAccountOtherUserEdit($account->account_otherUserEdit);
            $Account->setAccountOtherGroupEdit($account->account_otherGroupEdit);

            // Obtener los datos de la cuenta para aplicar las ACL
            $accountAclData = $Account->getAccountDataForACL();

            $AccountData = new AccountsSearchData();
            $AccountData->setTextMaxLength($maxTextLength);
            $AccountData->setId($account->account_id);
            $AccountData->setName($account->account_name);
            $AccountData->setLogin($account->account_login);
            $AccountData->setCategoryName($account->category_name);
            $AccountData->setCustomerName($account->customer_name);
            $AccountData->setCustomerLink((AccountsSearchData::$wikiEnabled) ? $wikiSearchUrl . $account->customer_name : '');
            $AccountData->setColor($this->pickAccountColor($account->account_customerId));
            $AccountData->setUrl($account->account_url);
            $AccountData->setFavorite(in_array($account->account_id, $favorites));
            $AccountData->setNumFiles((Checks::fileIsEnabled()) ? $account->num_files : 0);
            $AccountData->setShowView(Acl::checkAccountAccess(self::ACTION_ACC_VIEW, $accountAclData) && Acl::checkUserAccess(self::ACTION_ACC_VIEW));
            $AccountData->setShowViewPass(Acl::checkAccountAccess(self::ACTION_ACC_VIEW_PASS, $accountAclData) && Acl::checkUserAccess(self::ACTION_ACC_VIEW_PASS));
            $AccountData->setShowEdit(Acl::checkAccountAccess(self::ACTION_ACC_EDIT, $accountAclData) && Acl::checkUserAccess(self::ACTION_ACC_EDIT));
            $AccountData->setShowCopy(Acl::checkAccountAccess(self::ACTION_ACC_COPY, $accountAclData) && Acl::checkUserAccess(self::ACTION_ACC_COPY));
            $AccountData->setShowDelete(Acl::checkAccountAccess(self::ACTION_ACC_DELETE, $accountAclData) && Acl::checkUserAccess(self::ACTION_ACC_DELETE));

            // Obtenemos datos si el usuario tiene acceso a los datos de la cuenta
            if ($AccountData->isShow()) {
                $secondaryGroups = Groups::getGroupsNameForAccount($account->account_id);
                $secondaryUsers = UserAccounts::getUsersNameForAccount($account->account_id);

                $secondaryAccesses = sprintf('<em>(G) %s*</em><br>', $account->usergroup_name);

                if ($secondaryGroups) {
                    foreach ($secondaryGroups as $group) {
                        $secondaryAccesses .= sprintf('<em>(G) %s</em><br>', $group);
                    }
                }

                if ($secondaryUsers) {
                    foreach ($secondaryUsers as $user) {
                        $secondaryAccesses .= sprintf('<em>(U) %s</em><br>', $user);
                    }
                }

                $AccountData->setAccesses($secondaryAccesses);

                $accountNotes = '';

                if ($account->account_notes) {
                    $accountNotes = (strlen($account->account_notes) > 300) ? substr($account->account_notes, 0, 300) . "..." : $account->account_notes;
                    $accountNotes = nl2br(wordwrap(htmlspecialchars($accountNotes), 50, '<br>', true));
                }

                $AccountData->setNotes($accountNotes);
            }

            $accountsData[] = $AccountData;
        }

        return $accountsData;
    }

    /**
     * Seleccionar un color para la cuenta
     *
     * @param int $id El id del elemento a asignar
     * @return mixed
     */
    private function pickAccountColor($id)
    {
        $accountColor = Session::getAccountColor();

        if (!isset($accountColor)
            || !is_array($accountColor)
            || !isset($accountColor[$id])
        ) {
            // Se asigna el color de forma aleatoria a cada id
            $color = array_rand($this->_colors);

            $accountColor[$id] = '#' . $this->_colors[$color];
            Session::setAccountColor($accountColor);
        }

        return $accountColor[$id];
    }

    /**
     * Devuelve la matriz a utilizar en la vista
     *
     * @return DataGrid
     */
    private function getGrid()
    {
        $showOptionalActions = Session::getUserPreferences()->isOptionalActions();

        $GridActionView = new DataGridAction();
        $GridActionView->setId(self::ACTION_ACC_VIEW);
        $GridActionView->setType(DataGridActionType::VIEW_ITEM);
        $GridActionView->setName(_('Detalles de Cuenta'));
        $GridActionView->setTitle(_('Detalles de Cuenta'));
        $GridActionView->setIcon($this->_icons->getIconView());
        $GridActionView->setReflectionFilter('\\SP\\Controller\\AccountsSearchData', 'isShowView');
        $GridActionView->setOnClickFunction('sysPassUtil.Common.accGridAction');
        $GridActionView->setOnClickArgs(self::ACTION_ACC_VIEW);
        $GridActionView->setOnClickArgs(self::ACTION_ACC_SEARCH);
        $GridActionView->setOnClickArgs('this');

        $GridActionViewPass = new DataGridAction();
        $GridActionViewPass->setId(self::ACTION_ACC_VIEW_PASS);
        $GridActionViewPass->setType(DataGridActionType::VIEW_ITEM);
        $GridActionViewPass->setName(_('Ver Clave'));
        $GridActionViewPass->setTitle(_('Ver Clave'));
        $GridActionViewPass->setIcon($this->_icons->getIconViewPass());
        $GridActionViewPass->setReflectionFilter('\\SP\\Controller\\AccountsSearchData', 'isShowViewPass');
        $GridActionViewPass->setOnClickFunction('sysPassUtil.Common.accGridViewPass');
        $GridActionViewPass->setOnClickArgs('this');
        $GridActionViewPass->setOnClickArgs(1);

        // Añadir la clase para usar el portapapeles
        $ClipboardIcon = $this->_icons->getIconClipboard();
        $ClipboardIcon->setClass('clip-pass-button');

        $GridActionCopyPass = new DataGridAction();
        $GridActionCopyPass->setId(self::ACTION_ACC_VIEW_PASS);
        $GridActionCopyPass->setType(DataGridActionType::VIEW_ITEM);
        $GridActionCopyPass->setName(_('Copiar Clave en Portapapeles'));
        $GridActionCopyPass->setTitle(_('Copiar Clave en Portapapeles'));
        $GridActionCopyPass->setIcon($ClipboardIcon);
        $GridActionCopyPass->setReflectionFilter('\\SP\\Controller\\AccountsSearchData', 'isShowCopyPass');
        $GridActionCopyPass->setOnClickFunction('sysPassUtil.Common.accGridViewPass');
        $GridActionCopyPass->setOnClickArgs('this');
        $GridActionCopyPass->setOnClickArgs(0);

        $EditIcon = $this->_icons->getIconEdit();

        if (!$showOptionalActions) {
            $EditIcon->setClass('actions-optional');
        }

        $GridActionEdit = new DataGridAction();
        $GridActionEdit->setId(self::ACTION_ACC_EDIT);
        $GridActionEdit->setType(DataGridActionType::EDIT_ITEM);
        $GridActionEdit->setName(_('Editar Cuenta'));
        $GridActionEdit->setTitle(_('Editar Cuenta'));
        $GridActionEdit->setIcon($EditIcon);
        $GridActionEdit->setReflectionFilter('\\SP\\Controller\\AccountsSearchData', 'isShowEdit');
        $GridActionEdit->setOnClickFunction('sysPassUtil.Common.accGridAction');
        $GridActionEdit->setOnClickArgs(self::ACTION_ACC_EDIT);
        $GridActionEdit->setOnClickArgs(self::ACTION_ACC_SEARCH);
        $GridActionEdit->setOnClickArgs('this');

        $CopyIcon = $this->_icons->getIconCopy();

        if (!$showOptionalActions) {
            $CopyIcon->setClass('actions-optional');
        }

        $GridActionCopy = new DataGridAction();
        $GridActionCopy->setId(self::ACTION_ACC_COPY);
        $GridActionCopy->setType(DataGridActionType::NEW_ITEM);
        $GridActionCopy->setName(_('Copiar Cuenta'));
        $GridActionCopy->setTitle(_('Copiar Cuenta'));
        $GridActionCopy->setIcon($CopyIcon);
        $GridActionCopy->setReflectionFilter('\\SP\\Controller\\AccountsSearchData', 'isShowCopy');
        $GridActionCopy->setOnClickFunction('sysPassUtil.Common.accGridAction');
        $GridActionCopy->setOnClickArgs(self::ACTION_ACC_COPY);
        $GridActionCopy->setOnClickArgs(self::ACTION_ACC_SEARCH);
        $GridActionCopy->setOnClickArgs('this');

        $DeleteIcon = $this->_icons->getIconDelete();

        if (!$showOptionalActions) {
            $DeleteIcon->setClass('actions-optional');
        }

        $GridActionDel = new DataGridAction();
        $GridActionDel->setId(self::ACTION_ACC_DELETE);
        $GridActionDel->setType(DataGridActionType::DELETE_ITEM);
        $GridActionDel->setName(_('Eliminar Cuenta'));
        $GridActionDel->setTitle(_('Eliminar Cuenta'));
        $GridActionDel->setIcon($DeleteIcon);
        $GridActionDel->setReflectionFilter('\\SP\\Controller\\AccountsSearchData', 'isShowDelete');
        $GridActionDel->setOnClickFunction('sysPassUtil.Common.accGridAction');
        $GridActionDel->setOnClickArgs(self::ACTION_ACC_DELETE);
        $GridActionDel->setOnClickArgs(self::ACTION_ACC_SEARCH);
        $GridActionDel->setOnClickArgs('this');

        $GridActionRequest = new DataGridAction();
        $GridActionRequest->setId(self::ACTION_ACC_REQUEST);
        $GridActionRequest->setName(_('Solicitar Modificación'));
        $GridActionRequest->setTitle(_('Solicitar Modificación'));
        $GridActionRequest->setIcon($this->_icons->getIconEmail());
        $GridActionRequest->setReflectionFilter('\\SP\\Controller\\AccountsSearchData', 'isShowRequest');
        $GridActionRequest->setOnClickFunction('sysPassUtil.Common.accGridAction');
        $GridActionRequest->setOnClickArgs(self::ACTION_ACC_REQUEST);
        $GridActionRequest->setOnClickArgs(self::ACTION_ACC_SEARCH);
        $GridActionRequest->setOnClickArgs('this');

        $GridActionOptional = new DataGridAction();
        $GridActionOptional->setId(self::ACTION_ACC_REQUEST);
        $GridActionOptional->setName(_('Más Acciones'));
        $GridActionOptional->setTitle(_('Más Acciones'));
        $GridActionOptional->setIcon($this->_icons->getIconOptional());
        $GridActionOptional->setReflectionFilter('\\SP\\Controller\\AccountsSearchData', 'isShowOptional');
        $GridActionOptional->setOnClickFunction('sysPassUtil.Common.showOptional');
        $GridActionOptional->setOnClickArgs('this');

        $GridPager = new DataGridPager();
        $GridPager->setIconPrev($this->_icons->getIconNavPrev());
        $GridPager->setIconNext($this->_icons->getIconNavNext());
        $GridPager->setIconFirst($this->_icons->getIconNavFirst());
        $GridPager->setIconLast($this->_icons->getIconNavLast());
        $GridPager->setSortKey($this->_sortKey);
        $GridPager->setSortOrder($this->_sortOrder);
        $GridPager->setLimitStart($this->_limitStart);
        $GridPager->setLimitCount($this->_limitCount);
        $GridPager->setOnClickFunction('sysPassUtil.Common.searchSort');
        $GridPager->setOnClickArgs($this->_sortKey);
        $GridPager->setOnClickArgs($this->_sortOrder);
        $GridPager->setFilterOn($this->_filterOn);

        $Grid = new DataGrid();
        $Grid->setId('gridSearch');
        $Grid->setDataHeaderTemplate('datasearch-header');
        $Grid->setDataRowTemplate('datasearch-rows');
        $Grid->setDataPagerTemplate('datagrid-nav-full');
        $Grid->setHeader($this->getHeaderSort());
        $Grid->setDataActions($GridActionView);
        $Grid->setDataActions($GridActionViewPass);
        $Grid->setDataActions($GridActionCopyPass);
        $Grid->setDataActions($GridActionOptional);
        $Grid->setDataActions($GridActionEdit);
        $Grid->setDataActions($GridActionCopy);
        $Grid->setDataActions($GridActionDel);
        $Grid->setDataActions($GridActionRequest);
        $Grid->setPager($GridPager);
        $Grid->setData(new DataGridData());

        return $Grid;
    }

    /**
     * Devolver la cabecera con los campos de ordenación
     *
     * @return DataGridHeaderSort
     */
    private function getHeaderSort()
    {
        $GridSortCustomer = new DataGridSort();
        $GridSortCustomer->setName(_('Cliente'));
        $GridSortCustomer->setTitle(_('Ordenar por Cliente'));
        $GridSortCustomer->setSortKey(AccountSearch::SORT_CUSTOMER);
        $GridSortCustomer->setIconUp($this->_icons->getIconUp());
        $GridSortCustomer->setIconDown($this->_icons->getIconDown());

        $GridSortName = new DataGridSort();
        $GridSortName->setName(_('Nombre'));
        $GridSortName->setTitle(_('Ordenar por Nombre'));
        $GridSortName->setSortKey(AccountSearch::SORT_NAME);
        $GridSortName->setIconUp($this->_icons->getIconUp());
        $GridSortName->setIconDown($this->_icons->getIconDown());

        $GridSortCategory = new DataGridSort();
        $GridSortCategory->setName(_('Categoría'));
        $GridSortCategory->setTitle(_('Ordenar por Categoría'));
        $GridSortCategory->setSortKey(AccountSearch::SORT_CATEGORY);
        $GridSortCategory->setIconUp($this->_icons->getIconUp());
        $GridSortCategory->setIconDown($this->_icons->getIconDown());

        $GridSortLogin = new DataGridSort();
        $GridSortLogin->setName(_('Usuario'));
        $GridSortLogin->setTitle(_('Ordenar por Usuario'));
        $GridSortLogin->setSortKey(AccountSearch::SORT_LOGIN);
        $GridSortLogin->setIconUp($this->_icons->getIconUp());
        $GridSortLogin->setIconDown($this->_icons->getIconDown());

        $GridSortUrl = new DataGridSort();
        $GridSortUrl->setName(_('URL / IP'));
        $GridSortUrl->setTitle(_('Ordenar por URL / IP'));
        $GridSortUrl->setSortKey(AccountSearch::SORT_URL);
        $GridSortUrl->setIconUp($this->_icons->getIconUp());
        $GridSortUrl->setIconDown($this->_icons->getIconDown());

        $GridHeaderSort = new DataGridHeaderSort();
        $GridHeaderSort->addSortField($GridSortCustomer);
        $GridHeaderSort->addSortField($GridSortName);
        $GridHeaderSort->addSortField($GridSortCategory);
        $GridHeaderSort->addSortField($GridSortLogin);
        $GridHeaderSort->addSortField($GridSortUrl);

        return $GridHeaderSort;
    }
}