<?php
/**
 * sysPass
 *
 * @author    Manuel Domínguez
 * @link      http://syspass.org
 * @copyright 2012-2016 Manuel Domínguez manu.dg@gmail.com
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

namespace SP\Auth;

use latch;
use SP\Config\Config;


defined('APP_ROOT') || die(_('No es posible acceder directamente a este archivo'));

/**
 * Class AuthLatch
 *
 * @package SP\Auth
 */
class AuthLatch
{
    /**
     * Comprobar la conexión al servicio de Latch.
     *
     * @param string $appId     con el Id de la app
     * @param string $secret    con el secreto
     * @return false|int        con el número de operaciones encontradas
     * @author Manuel Domínguez <manu.dg@gmail.com>
     */
    public static function checkLatchConn($appId, $secret)
    {

        try {
            $api = new  \latch\Latch($appId, $secret);
            $operationsResponse = $api->getOperations();
            $errorConn = $operationsResponse->getError();
            $data = $operationsResponse->getData();
            if (!is_null($errorConn)) {
                return $errorConn->getCode() . ' ' . $errorConn->getMessage();
            }elseif (is_null($data)){
                return _('No hay conexión');
            }else{
                return true;
            }
        } catch (\Exception $e) {
            return _("Indefinido");
        }

        return true;
    }

    /**
     * Parear al usuario al servicio de Latch.
     *
     * @param string $token     con la cadena generada en la app del móvil
     * @return false|string     con el accountID de ese usuario
     * @author Manuel Domínguez <manu.dg@gmail.com>
     */
    public static function doPair($token)
    {
        $appId = Config::getValue('latch_id');
        $secret = Config::getValue('latch_secret');

        try {
            $api = new  \latch\Latch($appId, $secret);
            $response = $api->pair($token);
            $data = $response->getData();
            if (!is_null($data) && property_exists($data, "accountId")) {
                return $data->accountId;
            } else {
                return false;
            }
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Desparear al usuario al servicio de Latch.
     *
     * @param string $accountId     con el accountId guardado del usuario
     * @author Manuel Domínguez <manu.dg@gmail.com>
     *
     */
    public static function doUnPair($accountId)
    {
        $appId = Config::getValue('latch_id');
        $secret = Config::getValue('latch_secret');

        $api = new  \latch\Latch($appId, $secret);
        $response = $api->unpair($accountId);

    }

    /**
     * Comprobar el estado del latch del usuario.
     *
     * @param string $accountId     con el accountId guardado del usuario
     * @author Manuel Domínguez <manu.dg@gmail.com>
     *
     */
    public static function doLogin($accountId)
    {
        if (Config::getValue('latch_enabled') == true){

            $appId = Config::getValue('latch_id');
            $secret = Config::getValue('latch_secret');

            $api = new  \latch\Latch($appId, $secret);
            $status = $api->status($accountId);
            if (!empty($status) && $status->getData() != null) {
                $operations = $status->getData()->operations;
                $operation = $operations->$appId;
                if ($operation->status == "on" && property_exists($operation, "two_factor")) {
                    return $operation->two_factor->token;
                }
                return $operation->status;
            } else {
                if (Config::getValue('latch_fail') == 1){
                    return "off";
                }else{
                    return "on";
                }
            }
        }
        return "on";
    }
}