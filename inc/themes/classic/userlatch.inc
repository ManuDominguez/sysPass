<!-- Start Tab - UserLatch -->
<div id="tabs-<?php echo $userlatch_tabIndex; ?>">
    <div id="title" class="midroundup titleNormal">
        <?php echo _('Latch'); ?>
    </div>

    <form method="post" name="frmUserLatch" id="frmUserLatch" data-url="/ajax/ajax_userPrefsSave.php">
        <table id="tblSite" class="data tblConfig round">
            <tr>
                <td class="descField">
                    <?php echo _('Habilitar Latch'); ?>
                    <img src="<?php echo $icons->getIconHelp()->getIcon(); ?>" title="<?php echo _('Ayuda'); ?>" class="inputImgMini help-tooltip"/>
                    <div class="tooltip" for="help-security_latch" style="display:none;">
                        <p>
                            <?php echo _('Habilita la autenticación con Latch que requiere de la introducción de un token generado por la aplicación para smartphones Latch.'); ?>
                        </p>

                        <p>
                            <?php echo _('Para más información consultar: https://latch.elevenpaths.com/ '); ?>
                        </p>
                    </div>
                </td>
                <td class="valField">
                    <label for="latch_enabled"><?php echo ($chkLatchEnabled) ? _('SI') : _('NO'); ?></label>
                    <input type="checkbox" name="latch_enabled" id="latch_enabled"
                           class="checkbox" <?php echo $chkLatchEnabled; ?> />
                    <br><br>
                    <label class="mdl-textfield__label"
                           for="security_pin"><?php echo _('Código de pareado'); ?></label>
                    <input id="latch_pin" name="latch_pin" type="text"
                           class="mdl-textfield__input fg-blue100" maxlength="6" required/>
                    <br><br>
                    <img src="imgs/warning.png" ALT="<?php echo _('Atención'); ?>" class="iconMini"/>
                    <?php echo _('Una vez activada, sólo es posible acceder si se dispone del dispositivo generador de códigos asociado.'); ?>

                </td>
            </tr>
        </table>

        <input type="hidden" name="itemId" value="<?php echo $userId; ?>"/>
        <input type="hidden" name="activeTab" value="<?php echo $userlatch_tabIndex; ?>"/>
        <input type="hidden" name="actionId" value="<?php echo $userlatch_actionId; ?>"/>
        <input type="hidden" name="isAjax" value="1"/>
        <input type="hidden" name="sk" value="<?php echo $sk; ?>">

    </form>
    <div class="action">
        <button type="submit" form="frmUserLatch" title="<?php echo $icons->getIconSave()->getTitle(); ?>" class="button-action">
            <img src="<?php echo $icons->getIconSave()->getIcon(); ?>" alt="save" />
        </button>
    </div>
</div> <!-- End Tab - UserLatch -->
<script type="text/javascript">
    $(function () {
        $('#frmUserLatch').on('submit', function () {
            var url = $(this).data('url');
            var data = $(this).serialize();

            sysPassUtil.Common.sendAjax(data, url);

            return false;
        });
    })
</script>