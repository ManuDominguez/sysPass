<!-- Start Tab - Latch -->
<div id="tabs-<?php echo $latch_tabIndex; ?>">
    <div id="title" class="midroundup titleNormal">
        <?php echo _('Latch'); ?>
    </div>

    <form method="post" name="frmLatch" id="frmLatch" onsubmit="sysPassUtil.Common.configMgmt('config', this); return false;">
        <table id="tblLatch" class="data tblConfig round">
            <tr>
                <td class="descField">
                    <?php echo _('Habilitar Latch'); ?>

                    <div id="help-latch" class="icon material-icons fg-blue80">help_outline</div>
                    <div class="mdl-tooltip mdl-tooltip--large" for="help-latch">
                        <p>
                            <?php echo _('Habilita Latch como segundo factor de autenticación.'); ?>
                        </p>
                        <p>
                            <?php echo _('Para más información consultar: https://latch.elevenpaths.com/'); ?>
                        </p>
                    </div>
                </td>
                <td class="valField">
                    <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="latch_enabled">
                        <input type="checkbox" id="latch_enabled" class="mdl-switch__input fg-blue100"
                               name="latch_enabled"
                            <?php echo $chkLatch, ' ', $isDisabled; ?>/>
                        <span class="mdl-switch__label"></span>
                    </label>
                </td>
            </tr>
            <tr>
                <td class="descField">
                    <?php echo _('ID de aplicación'); ?>
                </td>
                <td class="valField">
                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                        <input id="latch_id" name="latch_id" type="text" class="mdl-textfield__input fg-blue100"
                               maxlength="128" value="<?php echo $latchId; ?>" <?php echo $isDisabled; ?>/>
                        <label class="mdl-textfield__label" for="latch_id"><?php echo _('ID de aplicación'); ?></label>
                    </div>
                </td>
            </tr>
            <tr>
                <td class="descField">
                    <?php echo _('Secreto'); ?>
                </td>
                <td class="valField">
                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                        <input id="latch_secret" name="latch_secret" type="text" class="mdl-textfield__input fg-blue100"
                               maxlength="128" value="<?php echo $latchSecret; ?>" <?php echo $isDisabled; ?>/>
                        <label class="mdl-textfield__label" for="latch_secret"><?php echo _('Secreto'); ?></label>
                    </div>
                </td>
            </tr>
            <tr>
                <td class="descField">
                    <?php echo _('Comprobar'); ?>
                </td>
                <td class="valField">
                    <img src="imgs/refresh.png" class="inputImg"
                         title="<?php echo _('Comprobar conexión con Latch'); ?>" onclick="sysPassUtil.Common.checkLatchConn('frmLatch');"/>
                </td>
            </tr>
        </table>

        <?php if ($isDemoMode): ?>
            <input type="hidden" name="latch_enabled" value="0"/>
        <?php endif; ?>

        <input type="hidden" name="activeTab" value="<?php echo $latch_tabIndex; ?>"/>
        <input type="hidden" name="actionId" value="<?php echo $latch_actionId; ?>"/>
        <input type="hidden" name="isAjax" value="1"/>
        <input type="hidden" name="sk" value="<?php echo $sk; ?>">
    </form>

    <div class="action">
        <button form="frmLatch"
                class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored bg-green80"
                title="<?php echo _('Guardar'); ?>">
            <i class="material-icons">save</i>
        </button>
    </div>
</div> <!-- End Tab - Latch -->