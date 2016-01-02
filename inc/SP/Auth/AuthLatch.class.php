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

namespace SP\Auth;

use latch;


defined('APP_ROOT') || die(_('No es posible acceder directamente a este archivo'));

/**
 * Class AuthLatch
 *
 * @package SP\Auth
 */
class AuthLatch
{
    //static $_appId = '';
    //static $_secret = '';



    /**
     * Comprobar la conexión al servicio de Latch.
     *
     * @param string $appId     con el Id de la app
     * @param string $secret    con el secreto
     * @return false|int        con el número de operaciones encontradas
     */
    public static function checkLatchConn($appId, $secret)
    {

        try {
            $api = new  \latch\Latch($appId, $secret);
            $operationsResponse = $api->getOperations();
            $errorConn = $operationsResponse->getError();
            if (!is_null($errorConn)) {
                return $errorConn->getCode() .' ' . $errorConn->getMessage();
            }else{
                return true;
            }
        } catch (\Exception $e) {
            return "Indefinido";
        }

        return true;
    }
    /*public static function getLatchApi()
    {
        return new Latch(self::$_appId, self::$_secret);
    }*/
}