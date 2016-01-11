<div id="actions" align="center">

    <div id="logo"></div>

    <form id="frmLatch2fa" action="" method="post">
        <fieldset id="resetdata">
            <legend><?php echo _('Autenticación Latch en 2 pasos'); ?></legend>
            <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                <input id="security_pin" name="security_pin" type="text"
                       class="mdl-textfield__input fg-blue100" maxlength="6" required/>
                <label class="mdl-textfield__label"
                       for="login"><?php echo _('Introducir código'); ?></label>
            </div>
            <br>
            <input type="hidden" name="itemId" value="<?php echo $userId; ?>">
            <input type="hidden" name="time" value="<?php echo $time; ?>">
            <input type="hidden" name="isAjax" value="1">
            <input type="hidden" name="sk" value="<?php echo $sk; ?>">
        </fieldset>

        <div class="buttons">
            <button id="btnLogin" class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent">
                <?php echo _('Acceder'); ?>
                <i class="material-icons" title="<?php echo _('Solicitar'); ?>">play_circle_filled</i>
            </button>
        </div>
    </form>
</div>

<script>
    window.onload = function () {
        $('#frmLatch2fa').on('submit', function () {
            sysPassUtil.Common.sendAjax($(this).serialize(),'/ajax/ajax_latch2fa.php');
            return false;
        })
    };
</script>