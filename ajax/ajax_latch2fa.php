<?php
/**
 * sysPass
 *
 * @author    Manuel Domínguez
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

use SP\Core\Session;
use SP\Core\SessionUtil;
use SP\Http\Request;
use SP\Http\Response;

define('APP_ROOT', '..');

require_once APP_ROOT . DIRECTORY_SEPARATOR . 'inc' . DIRECTORY_SEPARATOR . 'Base.php';

Request::checkReferer('POST');

$sk = Request::analyze('sk', false);

if (!$sk || !SessionUtil::checkSessionKey($sk)) {
    Response::printJSON(_('CONSULTA INVÁLIDA'));
}

$userId = Request::analyze('itemId', 0);
$pin = Request::analyze('security_pin', '');

$TwoFa = Session::getLatch2fa();

if ($userId
    && $pin
    && $TwoFa==$pin
) {
    Session::setLatchPassed(true);

    $urlParams = Request::importUrlParamsToGet();

    Response::printJSON(_('Código correcto'), 0, 'sysPassUtil.Common.redirect(\'index.php\')');
} else {
    Session::setLatchPassed(false);
    Response::printJSON(_('Código incorrecto'));
}