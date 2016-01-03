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
                    <div id="help-security_latch" class="icon material-icons fg-blue80">help_outline</div>
                    <div class="mdl-tooltip mdl-tooltip--large" for="help-security_latch">
                        <p>
                            <?php echo _('Habilita la autenticación con Latch que requiere de la introducción de un token generado por la aplicación para smartphones Latch.'); ?>
                        </p>

                        <p>
                            <?php echo _('Para más información consultar: https://latch.elevenpaths.com/ '); ?>
                        </p>
                    </div>
                </td>
                <td class="valField">
                    <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="latch_enabled">
                        <input type="checkbox" id="latch_enabled" class="mdl-switch__input fg-blue100"
                               name="latch_enabled" <?php echo ($chkLatchEnabled) ? 'checked' : ''; ?>/>
                        <span class="mdl-switch__label"><?php echo _('Activar'); ?></span>
                    </label>

                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                        <input id="latch_pin" name="latch_pin" type="text"
                               class="mdl-textfield__input fg-blue100" maxlength="6" />
                        <label class="mdl-textfield__label"
                               for="latch_pin"><?php echo _('Código de pareado'); ?></label>
                    </div>
                    <br>

                    <div class="icon material-icons fg-orange80">warning</div>
                    <?php echo _('Una vez activado, sólo es posible acceder si se dispone del dispositivo generador de códigos asociado.'); ?>
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
        <button form="frmUserLatch" type="submit"
                class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored bg-green80"
                title="<?php echo _('Guardar'); ?>">
            <i class="material-icons">save</i>
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