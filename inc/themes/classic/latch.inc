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
                    <img src="<?php echo $icons->getIconHelp()->getIcon(); ?>" title="<?php echo _('Ayuda'); ?>" class="inputImgMini help-tooltip"/>
                    <div class="tooltip" for="help-latch" style="display:none;">
                        <p>
                            <?php echo _('Habilita Latch como segundo factor de autenticación.'); ?>
                        </p>
                        <p>
                            <?php echo _('Para más información consultar: https://latch.elevenpaths.com/'); ?>
                        </p>
                    </div>
                </td>
                <td class="valField">
                    <label for="latchenabled"><?php echo ($chkLatch) ? _('SI') : _('NO'); ?></label>
                    <input type="checkbox" name="latch_enabled" id="latchenabled"
                           class="checkbox" <?php echo $chkLatch, ' ', $isDisabled; ?> />
                </td>
            </tr>
            <tr>
                <td class="descField">
                    <?php echo _('ID de aplicación'); ?>
                </td>
                <td class="valField">
                    <input type="text" name="latch_id" value="<?php echo $latchId; ?>"
                           maxlength="128" <?php echo $isDisabled; ?>/>
                </td>
            </tr>
            <tr>
                <td class="descField">
                    <?php echo _('Secreto'); ?>
                </td>
                <td class="valField">
                    <input type="text" name="latch_secret" value="<?php echo $latchSecret; ?>"
                           maxlength="128" <?php echo $isDisabled; ?>/>
                </td>
            </tr>
            <tr>
                <td class="descField">
                    <?php echo _('Fallo servicios Latch'); ?>
                    <img src="<?php echo $icons->getIconHelp()->getIcon(); ?>" title="<?php echo _('Ayuda'); ?>" class="inputImgMini help-tooltip"/>
                    <div class="tooltip" for="help-latch-available" style="display:none;">
                        <p>
                            <?php echo _('Qué hacer en caso de fallo en los servicios de Latch'); ?>
                        </p>
                    </div>
                </td>
                <td class="valField">
                    <select id="sel-faillatch" name="faillatch"
                            class="sel-chosen-ns" <?php echo $isDisabled; ?> required>
                        <option value="1"></option>
                        <?php foreach ($latchAvailable as $id => $name): ?>
                            <option value="<?php echo $id; ?>" <?php echo ($id === $latchFail) ? 'selected' : ''; ?>><?php echo $name; ?></option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <td class="descField">
                    <?php echo _('Comprobar'); ?>
                </td>
                <td class="valField">
                    <img src="<?php echo $icons->getIconRefresh()->getIcon(); ?>" class="inputImg"
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
        <button type="submit" form="frmLatch" title="<?php echo $icons->getIconSave()->getTitle(); ?>" class="button-action">
            <img src="<?php echo $icons->getIconSave()->getIcon(); ?>" alt="save" />
        </button>
    </div>
</div> <!-- End Tab - Latch -->