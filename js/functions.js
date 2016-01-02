//
// From http://www.kenneth-truyers.net/2013/04/27/javascript-namespaces-and-modules/
//
var sysPass = sysPass || {};

// create a general purpose namespace method
// this will allow us to create namespace a bit easier
sysPass.createNS = function (namespace) {
    var nsparts = namespace.split(".");
    var parent = sysPass;

    // we want to be able to include or exclude the root namespace
    // So we strip it if it's in the namespace
    if (nsparts[0] === "sysPass") {
        nsparts = nsparts.slice(1);
    }

    // loop through the parts and create
    // a nested namespace if necessary
    for (var i = 0; i < nsparts.length; i++) {
        var partname = nsparts[i];
        // check if the current parent already has
        // the namespace declared, if not create it
        if (typeof parent[partname] === "undefined") {
            parent[partname] = {};
        }
        // get a reference to the deepest element
        // in the hierarchy so far
        parent = parent[partname];
    }
    // the parent is now completely constructed
    // with empty namespaces and can be used.
    return parent;
};

// Namespace principasl de sysPass
sysPass.createNS('sysPass.Util');
sysPass.Util.Common = function () {
    "use strict";

    var APP_ROOT, LANG, PK;

    // Atributos de la ordenación de búsquedas
    var order = {key: 0, dir: 0};

    // Variable para determinar si una clave de cuenta ha sido copiada al portapapeles
    var passToClip = 0;
    // Variable para el ajuste óptimo del contenido a la altura del documento
    var windowAdjustSize = 450;
    // Variable para almacena la llamada a setTimeout()
    var timeout;

    // Atributos del generador de claves
    var passwordData = {
        passLength: 0,
        minPasswordLength: 8,
        complexity: {
            numbers: true,
            symbols: true,
            uppercase: true,
            numlength: 12
        }
    };

    // Inicializar la encriptación RSA
    var encrypt = new JSEncrypt();

    $(document).ready(function () {
        initializeClipboard();
        PK !== '' && bindPassEncrypt();
    });

    //$.ajaxSetup({
    //    error: function(jqXHR, exception) {
    //        if (jqXHR.status === 0) {
    //            $('#content').fadeIn().html(resMsg("nofancyerror", jqXHR.responseText));
    //        } else if (jqXHR.status == 404) {
    //            $('#content').fadeIn().html(resMsg("nofancyerror", jqXHR.responseText));
    //        } else if (jqXHR.status == 500) {
    //            $('#content').fadeIn().html(resMsg("nofancyerror", jqXHR.responseText));
    //        } else if (exception === 'parsererror') {
    //            $('#content').fadeIn().html(resMsg("nofancyerror", jqXHR.responseText));
    //        } else if (exception === 'timeout') {
    //            $('#content').fadeIn().html(resMsg("nofancyerror", jqXHR.responseText));
    //        } else if (exception === 'abort') {
    //            $('#content').fadeIn().html(resMsg("nofancyerror", jqXHR.responseText));
    //        } else {
    //            $('#content').fadeIn().html(resMsg("nofancyerror", jqXHR.responseText));
    //            //alert('Uncaught Error.n' + jqXHR.responseText);
    //        }
    //    }
    //});

    // Obtener las variables de entorno de sysPass
    var getEnvironment = function () {
        var path = window.location.pathname.split('/');
        var rootPath = function () {
            var fullPath = '';

            for (var i = 1; i <= path.length - 2; i++) {
                fullPath += "/" + path[i];
            }

            return fullPath;
        };
        var url = window.location.protocol + "//" + window.location.host + rootPath();

        $.ajax({
            type: 'GET',
            url: url + '/ajax/ajax_getEnvironment.php',
            dataType: "json",
            async: false,
            data: {isAjax: 1},
            success: function (json) {
                APP_ROOT = json.app_root;
                LANG = json.lang;
                PK = json.pk;

                encrypt.setPublicKey(PK);
            }
        });
    };

    getEnvironment();

    // Función para cargar el contenido de la acción del menú seleccionada
    var doAction = function (actionId, lastAction, itemId) {
        var data = {'actionId': actionId, 'lastAction': lastAction, 'itemId': itemId, isAjax: 1};

        $.ajax({
            type: 'POST',
            dataType: 'html',
            url: APP_ROOT + '/ajax/ajax_getContent.php',
            data: data,
            success: function (response) {
                $('#content').html(response);
                setContentSize();
            },
            error: function () {
                $('#content').html(resMsg("nofancyerror"));
            }
        });
    };

    var accGridAction = function (actionId, lastAction, obj) {
        var id = $(obj).data('account-id');
        var sk = $(obj).data('sk');

        doAction(actionId, lastAction, id);
    };

    var accGridViewPass = function (obj, show) {
        var id = $(obj).data('account-id');
        var sk = $(obj).data('sk');

        console.info(show);

        viewPass(id, show);
    };

    // Función para establecer la altura del contenedor ajax
    var setContentSize = function () {
        if ($("#container").hasClass('content-no-auto-resize')) {
            return;
        }

        // Calculate total height for full body resize
        var totalHeight = $("#content").height() + 200;
        //var totalWidth = $("#wrap").width();

        $("#container").css("height", totalHeight);
    };

    // Función para retornar el scroll a la posición inicial
    var scrollUp = function () {
        $('html, body').animate({scrollTop: 0}, 'slow');
    };

    // Función para limpiar un formulario
    var clearSearch = function (clearStart) {
        if (clearStart === 1) {
            $('#frmSearch').find('input[name="start"]').val(0);
            return;
        }

        document.frmSearch.search.value = "";
        $('#frmSearch').find('select').prop('selectedIndex', 0).trigger("chosen:updated");
        $('#frmSearch').find('input[name="start"], input[name="skey"], input[name="sorder"]').val(0);
        order.key = 0;
        order.dir = 0;
    };

    // Funcion para crear un desplegable con opciones
    var mkChosen = function (options) {
        $('#' + options.id).chosen({
            allow_single_deselect: true,
            placeholder_text_single: options.placeholder,
            disable_search_threshold: 10,
            no_results_text: options.noresults,
            width: "200px"
        });
    };

    // Función para la búsqueda de cuentas mediante filtros
    var accSearch = function (continous, event) {
        var lenTxtSearch = $('#txtSearch').val().length;

        if (typeof event !== 'undefined' &&
            ((event.keyCode < 48 && event.keyCode !== 13) || (event.keyCode > 105 && event.keyCode < 123))) {
            return;
        }

        if (lenTxtSearch < 3 && continous === 1 && lenTxtSearch > window.lastlen && event.keyCode !== 13) {
            return;
        }

        window.lastlen = lenTxtSearch;

        $('#frmSearch').find('input[name="start"]').val(0);

        doSearch();
    };

    // Función para la búsqueda de cuentas mediante ordenación
    var searchSort = function (skey, dir, start) {
        if (typeof skey === 'undefined' || typeof start === 'undefined') {
            return false;
        }

        $('#frmSearch').find('input[name="skey"]').val(skey);
        $('#frmSearch').find('input[name="sorder"]').val(dir);
        $('#frmSearch').find('input[name="start"]').val(start);

        doSearch();
    };

    // Función para la búsqueda de cuentas
    var doSearch = function () {
        var frmData = $("#frmSearch").serialize();

        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: APP_ROOT + '/ajax/ajax_search.php',
            data: frmData,
            success: function (json) {
                $('#resBuscar').html(json.html);
                $('#resBuscar').css("max-height", $('html').height() - windowAdjustSize);


                if (typeof json.sk !== 'undefined') {
                    // Actualizar el token de seguridad
                    $("#frmSearch").find(":input[name='sk']").val(json.sk);
                }
            },
            error: function () {
                $('#resBuscar').html(resMsg("nofancyerror"));
            },
            complete: function () {
                sysPassUtil.hideLoading();
                scrollUp();
            }
        });
    };

    // Mostrar el orden de campo y orden de búsqueda utilizados
    var showSearchOrder = function () {
        if (order.key) {
            $('#search-sort-' + order.key).addClass('filterOn');
            if (order.dir === 0) {
                $('#search-sort-' + order.key).append('<img src="imgs/arrow_down.png" style="width:17px;height:12px;" />');
            } else {
                $('#search-sort-' + order.key).append('<img src="imgs/arrow_up.png" style="width:17px;height:12px;" />');
            }
        }
    };

    // Función para navegar por el log de eventos
    var navLog = function (start, current) {
        if (typeof start === 'undefined') {
            return false;
        }

        $.ajax({
            type: 'POST',
            dataType: 'html',
            url: APP_ROOT + '/ajax/ajax_eventlog.php',
            data: {'start': start, 'current': current},
            success: function (response) {
                $('#content').html(response);
            },
            error: function () {
                $('#content').html(resMsg("nofancyerror"));
            },
            complete: function () {
                sysPassUtil.hideLoading();
                scrollUp();
            }
        });
    };

    // Función para ver la clave de una cuenta
    var viewPass = function (id, show, history) {
        $.ajax({
            type: 'POST',
            url: APP_ROOT + '/ajax/ajax_viewpass.php',
            dataType: "json",
            async: false,
            data: {'accountid': id, 'full': show, 'isHistory': history, 'isAjax': 1},
            success: function (json) {

                if (json.status === 10) {
                    doLogout();
                    return;
                }

                if (show == false) {
                    // Copiamos la clave en el objeto que tiene acceso al portapapeles
                    $('#clip-pass-text').html(json.accpass);
                    passToClip = 1;
                    return;
                }

                $('<div></div>').dialog({
                    modal: true,
                    title: LANG[47],
                    width: 'auto',
                    open: function () {
                        var thisDialog = $(this);
                        var content;
                        var pass = '';
                        var clipboardUserButton =
                            '<button class="dialog-clip-user-button ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-primary" data-clipboard-target=".dialog-user-text">' +
                            '<span class="ui-button-icon-primary ui-icon ui-icon-clipboard"></span>' +
                            '<span class="ui-button-text">' + LANG[33] + '</span>' +
                            '</button>';
                        var clipboardPassButton =
                            '<button class="dialog-clip-pass-button ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-primary" data-clipboard-target=".dialog-pass-text">' +
                            '<span class="ui-button-icon-primary ui-icon ui-icon-clipboard"></span>' +
                            '<span class="ui-button-text">' + LANG[34] + '</span>' +
                            '</button>';
                        var useImage = json.useimage;
                        var user = '<p class="dialog-user-text">' + json.acclogin + '</p>';

                        if (json.status === 0) {
                            if (useImage === 0) {
                                pass = '<p class="dialog-pass-text">' + json.accpass + '</p>';
                            } else {
                                pass = '<img class="dialog-pass-text" src="data:image/png;base64,' + json.accpass + '" />';
                                clipboardPassButton = '';
                            }

                            content = user + pass + '<div class="dialog-buttons">' + clipboardUserButton + clipboardPassButton + '</div>';
                        } else {
                            content = '<span class="altTxtRed">' + json.description + '</span>';

                            thisDialog.dialog("option", "buttons",
                                [{
                                    text: "Ok",
                                    icons: {primary: "ui-icon-close"},
                                    click: function () {
                                        thisDialog.dialog("close");
                                    }
                                }]
                            );
                        }

                        thisDialog.html(content);

                        // Recentrar después de insertar el contenido
                        thisDialog.dialog('option', 'position', 'center');

                        // Cerrar Dialog a los 30s
                        thisDialog.parent().on('mouseleave', function () {
                            clearTimeout(timeout);
                            timeout = setTimeout(function () {
                                thisDialog.dialog('close');
                            }, 30000);
                        });
                    },
                    // Forzar la eliminación del objeto para que siga copiando al protapapeles al abrirlo de nuevo
                    close: function () {
                        clearTimeout(timeout);
                        $(this).dialog("destroy");
                    }
                });
            }
        });
    };

    // Función para obtener las variables de la URL y parsearlas a un array.
    var getUrlVars = function () {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    };

    // Función para autentificar usuarios
    var doLogin = function () {
        var data = $('#frmLogin').serialize();

        $("#btnLogin").prop('disabled', true);

        $.ajax({
            type: "POST",
            dataType: "json",
            url: APP_ROOT + '/ajax/ajax_doLogin.php',
            data: data,
            success: function (json) {
                var status = json.status;
                var description = json.description;

                if (status === 0 || status === 2) {
                    location.href = description;
                } else if (status === 3 || status === 4) {
                    resMsg("error", description);
                    $('#user').val('').focus();
                    $('#pass').val('');
                    $("#mpass").prop('disabled', false);
                    $('#smpass').val('').show();
                } else if (status === 5) {
                    resMsg("warn", description, '', "location.href = 'index.php';");
                } else {
                    $('#user').val('').focus();
                    $('#pass').val('');
                    resMsg("error", description);
                }
            },
            complete: function () {
                $('#btnLogin').prop('disabled', false);
                sysPassUtil.hideLoading();
            },
            statusCode: {
                404: function () {
                    var txt = LANG[1] + '<p>' + LANG[13] + '</p>';
                    resMsg("error", txt);
                }
            }
        });

        return false;
    };

    // Función para salir de la sesión
    var doLogout = function () {
        var url = window.location.search;

        if (url.length > 0) {
            location.href = 'index.php' + url + '&logout=1';
        } else {
            location.href = 'index.php?logout=1';
        }
    };

    // Función para comprobar si se ha salido de la sesión
    var checkLogout = function () {
        var session = getUrlVars()["session"];

        if (session === 0) {
            resMsg("warn", LANG[2], '', "location.search = ''");
        }
    };

    var redirect = function (url) {
        location.href = url;
    };

    // Función para añadir/editar una cuenta
    var saveAccount = function (frm) {
        var data = $("#" + frm).serialize();
        var id = $('input[name="accountid"]').val();
        var action = $('input[name="next"]').val();

        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: APP_ROOT + '/ajax/ajax_accountSave.php',
            data: data,
            success: function (json) {
                var status = json.status;
                var description = json.description;

                if (status === 0) {
                    resMsg("ok", description);

                    if (action && id) {
                        doAction(action, 1, id);
                    } else if (action) {
                        doAction(action, 1);
                    }
                } else if (status === 10) {
                    doLogout();
                } else {
                    resMsg("error", description);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var txt = LANG[1] + '<p>' + errorThrown + textStatus + '</p>';
                resMsg("error", txt);
            }
        });
    };

    // Función para eliminar una cuenta
    var delAccount = function (id, action, sk) {
        var data = {accountid: id, actionId: action, sk: sk};
        var atext = '<div id="alert"><p id="alert-text">' + LANG[3] + '</p></div>';
        var url = '/ajax/ajax_accountSave.php';

        alertify
            .okBtn(LANG[43])
            .cancelBtn(LANG[44])
            .confirm(atext, function (e) {
                sendAjax(data, url);
            }, function (e) {
                e.preventDefault();

                alertify.error(LANG[44]);
            });
    };

    // Función para enviar una solicitud de modificación de cuenta
    var sendRequest = function () {
        var url = '/ajax/ajax_sendRequest.php';
        var data = $('#frmRequestModify').serialize();

        sendAjax(data, url);
    };

    // Función para guardar la configuración
    var configMgmt = function (action, obj) {
        var url;

        switch (action) {
            case "config":
                url = '/ajax/ajax_configSave.php';
                break;
            case "export":
                url = '/ajax/ajax_backup.php';
                break;
            case "import":
                url = '/ajax/ajax_migrate.php';
                break;
            case "preferences":
                url = '/ajax/ajax_userPrefsSave.php';
                break;
            default:
                return;
        }

        var data = $(obj).serialize();

        sendAjax(data, url);
    };

    // Función para descargar/ver archivos de una cuenta
    var downFile = function (id, sk, actionId, download) {
        var data = {'fileId': id, 'sk': sk, 'actionId': actionId};

        if (typeof download === 'undefined') {
            $.ajax({
                type: "POST",
                cache: false,
                url: APP_ROOT + "/ajax/ajax_files.php",
                data: data,
                success: function (response) {
                    if (typeof response.status !== 'undefined' && response.status === 1) {
                        resMsg("error", response.description);
                        return;
                    }

                    if (response) {
                        $.fancybox(response, {padding: [10, 10, 10, 10]});
                        // Actualizar fancybox para adaptarlo al tamaño de la imagen
                        setTimeout(function () {
                            $.fancybox.update();
                        }, 1000);
                    } else {
                        resMsg("error", LANG[14]);
                    }

                }
            });
        } else if (download === true) {
            $.fileDownload(APP_ROOT + '/ajax/ajax_files.php', {'httpMethod': 'POST', 'data': data});
        }
    };

    // Función para descargar/ver archivos de una cuenta
    var viewFile = function (obj, actionId, sk) {
        var itemId = $(obj).attr('data-itemid');

        var data = {'fileId': itemId, 'sk': sk, 'actionId': actionId};

        $.ajax({
            type: "POST",
            cache: false,
            url: APP_ROOT + "/ajax/ajax_files.php",
            data: data,
            success: function (response) {
                if (typeof response.status !== 'undefined' && response.status === 1) {
                    resMsg("error", response.description);
                    return;
                }

                if (response) {
                    $.fancybox(response, {padding: [10, 10, 10, 10]});
                    // Actualizar fancybox para adaptarlo al tamaño de la imagen
                    setTimeout(function () {
                        $.fancybox.update();
                    }, 1000);
                } else {
                    resMsg("error", LANG[14]);
                }

            }
        });
    };

    // Función para obtener la lista de archivos de una cuenta
    var getFiles = function (id, isDel, sk) {
        var data = {'id': id, 'del': isDel, 'sk': sk};

        $.ajax({
            type: "GET",
            cache: false,
            url: APP_ROOT + "/ajax/ajax_getFiles.php",
            data: data,
            success: function (response) {
                $('#downFiles').html(response);
            }
        });
    };

    // Función para eliminar archivos de una cuenta
    var delFile = function (id, sk, accountId, actionId) {
        var atext = '<div id="alert"><p id="alert-text">' + LANG[15] + '</p></div>';

        alertify
            .okBtn(LANG[43])
            .cancelBtn(LANG[44])
            .confirm(atext, function (e) {
                var data = {'fileId': id, 'actionId': actionId, 'sk': sk};

                $.post(APP_ROOT + '/ajax/ajax_files.php', data,
                    function (data) {
                        if (data.status === 0) {
                            var url = APP_ROOT + "/ajax/ajax_getFiles.php?id=" + accountId + "&del=1&isAjax=1&sk=" + sk;
                            $("#downFiles").load(url);

                            resMsg("ok", data.description);
                        } else {
                            resMsg("error", data.description);
                        }
                    }
                );
            }, function (e) {
                e.preventDefault();

                alertify.error(LANG[44]);
            });
    };

    // Función para activar el Drag&Drop de archivos en las cuentas
    var dropFile = function (accountId, sk, maxsize, actionId) {
        var dropfiles = $('#dropzone');
        var file_exts_ok = dropfiles.attr('data-files-ext').toLowerCase().split(',');

        dropfiles.filedrop({
            fallback_id: 'inFile',
            paramname: 'inFile',
            maxfiles: 5,
            maxfilesize: maxsize,
            allowedfileextensions: file_exts_ok,
            url: APP_ROOT + '/ajax/ajax_files.php',
            data: {
                sk: sk,
                accountId: accountId,
                actionId: actionId,
                isAjax: 1
            },
            uploadFinished: function (i, file, response) {
                sysPassUtil.hideLoading();

                if (response.status === 0) {
                    var sk = $('input[name="sk"]').val();
                    var url = APP_ROOT + "/ajax/ajax_getFiles.php?id=" + accountId + "&del=1&isAjax=1&sk=" + sk;
                    $("#downFiles").load(url);

                    resMsg("ok", response.description);
                } else {
                    resMsg("error", response.description);
                }
            },
            error: function (err, file) {
                switch (err) {
                    case 'BrowserNotSupported':
                        resMsg("error", LANG[16]);
                        break;
                    case 'TooManyFiles':
                        resMsg("error", LANG[17] + ' (max. ' + this.maxfiles + ')');
                        break;
                    case 'FileTooLarge':
                        resMsg("error", LANG[18] + ' ' + maxsize + ' MB' + '<br>' + file.name);
                        break;
                    case 'FileExtensionNotAllowed':
                        resMsg("error", LANG[19]);
                        break;
                    default:
                        break;
                }
            },
            uploadStarted: function (i, file, len) {
                sysPassUtil.showLoading();
            }
        });
    };

    // Función para activar el Drag&Drop de archivos en la importación de cuentas
    var importFile = function (sk) {
        var dropfiles = $('#dropzone');
        var file_exts_ok = ['csv', 'xml'];

        dropfiles.filedrop({
            fallback_id: 'inFile',
            paramname: 'inFile',
            maxfiles: 1,
            maxfilesize: 1,
            allowedfileextensions: file_exts_ok,
            url: APP_ROOT + '/ajax/ajax_import.php',
            data: {
                sk: sk,
                action: 'import',
                isAjax: 1,
                importPwd: function () {
                    return $('input[name="importPwd"]').val();
                },
                defUser: function () {
                    return $('#import_defaultuser').chosen().val();
                },
                defGroup: function () {
                    return $('#import_defaultgroup').chosen().val();
                },
                csvDelimiter: function () {
                    return $('input[name="csvDelimiter"]').val();
                }
            },
            uploadFinished: function (i, file, json) {
                sysPassUtil.hideLoading();

                var status = json.status;
                var description = json.description;

                if (status === 0) {
                    resMsg("ok", description);
                } else if (status === 10) {
                    resMsg("error", description);
                    doLogout();
                } else {
                    resMsg("error", description);
                }
            },
            error: function (err, file) {
                switch (err) {
                    case 'BrowserNotSupported':
                        resMsg("error", LANG[16]);
                        break;
                    case 'TooManyFiles':
                        resMsg("error", LANG[17] + ' (max. ' + this.maxfiles + ')');
                        break;
                    case 'FileTooLarge':
                        resMsg("error", LANG[18] + '<br>' + file.name);
                        break;
                    case 'FileExtensionNotAllowed':
                        resMsg("error", LANG[19]);
                        break;
                    default:
                        break;
                }
            },
            uploadStarted: function (i, file, len) {
                sysPassUtil.showLoading();
            }
        });
    };

    // Función para realizar una petición ajax
    var sendAjax = function (data, url) {
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: APP_ROOT + url,
            data: data,
            success: function (json) {
                var status = json.status;
                var description = json.description;
                var action = json.action;

                switch (status) {
                    case 0:
                        $.fancybox.close();
                        resMsg("ok", description, undefined, action);
                        break;
                    case 1:
                        $.fancybox.close();
                        $(":input[type=password]").val('');
                        resMsg("error", description, undefined, action);
                        break;
                    case 2:
                        $("#resFancyAccion").html('<span class="altTxtError">' + description + '</span>').show();
                        break;
                    case 3:
                        $.fancybox.close();
                        resMsg("warn", description, undefined, action);
                        break;
                    case 10:
                        doLogout();
                        break;
                    default:
                        return;
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var txt = LANG[1] + '<p>' + errorThrown + textStatus + '</p>';
                resMsg("error", txt);
            }
        });
    };

    // Función para mostrar el formulario para cambio de clave de usuario
    var usrUpdPass = function (object, actionId, sk) {
        var userId = $(object).attr("data-itemid");
        var data = {'userId': userId, 'actionId': actionId, 'sk': sk, 'isAjax': 1};

        $.ajax({
            type: "GET",
            cache: false,
            url: APP_ROOT + '/ajax/ajax_usrpass.php',
            data: data,
            success: function (data) {
                if (data.length === 0) {
                    doLogout();
                } else {
                    $.fancybox(data, {padding: 0});
                }
            }
        });
    };

    // Función para mostrar los datos de un registro
    var appMgmtData = function (obj, actionId, sk) {
        var itemId = $(obj).attr('data-itemid');
        var activeTab = $(obj).attr('data-activetab');

        var data = {'itemId': itemId, 'actionId': actionId, 'sk': sk, 'activeTab': activeTab, 'isAjax': 1};
        var url = APP_ROOT + '/ajax/ajax_appMgmtData.php';

        $.ajax({
            type: 'POST',
            dataType: 'html',
            url: url,
            data: data,
            success: function (response) {
                $.fancybox(response, {padding: [0, 10, 10, 10]});
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var txt = LANG[1] + '<p>' + errorThrown + textStatus + '</p>';
                resMsg("error", txt);
            }
        });
    };

    // Función para borrar un registro
    var appMgmtDelete = function (obj, actionId, sk) {
        var itemId = $(obj).attr('data-itemid');
        var activeTab = $(obj).attr('data-activetab');
        var nextActionId = $(obj).attr('data-nextactionid');
        var atext = '<div id="alert"><p id="alert-text">' + LANG[12] + '</p></div>';

        var url = '/ajax/ajax_appMgmtSave.php';
        var data = {
            'itemId': itemId,
            'actionId': actionId,
            'sk': sk,
            'activeTab': activeTab,
            'onCloseAction': nextActionId
        };

        alertify
            .okBtn(LANG[43])
            .cancelBtn(LANG[44])
            .confirm(atext, function (e) {
                sendAjax(data, url);
            }, function (e) {
                e.preventDefault();

                alertify.error(LANG[44]);
            });
    };

    // Función para editar los datos de un registro
    var appMgmtSave = function (frmId) {
        var url = '/ajax/ajax_appMgmtSave.php';
        var data = $("#" + frmId).serialize();

        sendAjax(data, url);
    };

    var appMgmtSearch = function (form) {
        var targetId = form.elements.target.value;
        var data = $(form).serialize();

        appMgmtSearchAjax(data, targetId);

        return false;
    };

    var appMgmtNav = function (formId, count, start) {
        var form = $('#' + formId);
        var targetId = form.find('[name=target]').val();
        var sk = form.find('[name=sk]').val();
        var data = form.serialize() + '&sk=' + sk + '&start=' + start + '&count=' + count;

        appMgmtSearchAjax(data, targetId);

        return false;
    };

    var appMgmtSearchAjax = function(data, targetId) {
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: APP_ROOT + '/ajax/ajax_appMgmtSearch.php',
            data: data,
            success: function (json) {
                if (json.status === 0) {
                    $('#' + targetId).html(json.html);
                    $('form').find('[name=sk]').val(json.sk);
                } else {
                    $('#' + targetId).html(resMsg('nofancyerror', json.description));
                }
            },
            error: function () {
                $('#' + targetId).html(resMsg('nofancyerror', 'error'));
            },
            complete: function (json) {
                sysPassUtil.hideLoading();
            }
        });
    };

    // Función para crear un enlace público
    var linksMgmtSave = function (itemId, actionId, sk) {
        var url = '/ajax/ajax_appMgmtSave.php';
        var data = {'itemId': itemId, 'actionId': actionId, 'sk': sk, 'isAjax': 1};

        alertify
            .okBtn(LANG[40])
            .cancelBtn(LANG[41])
            .confirm(LANG[48], function (e) {
                $.extend(data, {notify: 1});
                sendAjax(data, url);
            }, function (e) {
                e.preventDefault();
                sendAjax(data, url);
            });
    };

    // Función para renovar un enlace
    var linksMgmtRefresh = function (obj, actionId, sk) {
        var itemId = $(obj).attr('data-itemid');
        var activeTab = $(obj).attr('data-activetab');
        var nextActionId = $(obj).attr('data-nextactionid');

        var url = '/ajax/ajax_appMgmtSave.php';
        var data = {
            'itemId': itemId,
            'actionId': actionId,
            'sk': sk,
            'activeTab': activeTab,
            'onCloseAction': nextActionId
        };

        sendAjax(data, url);
    };

    // Función para verificar si existen actualizaciones
    var checkUpds = function () {
        $.ajax({
            type: 'GET',
            dataType: 'html',
            url: APP_ROOT + '/ajax/ajax_checkUpds.php',
            timeout: 10000,
            success: function (response) {
                $('#updates').html(response);

                if (typeof  componentHandler !== "undefined") {
                    componentHandler.upgradeDom();
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $('#updates').html('!');
            }
        });
    };

    // Función para limpiar el log de eventos
    var clearEventlog = function (sk) {
        var atext = '<div id="alert"><p id="alert-text">' + LANG[20] + '</p></div>';

        alertify
            .okBtn(LANG[43])
            .cancelBtn(LANG[44])
            .confirm(atext, function (e) {
                var data = {'clear': 1, 'sk': sk, 'isAjax': 1};
                var url = '/ajax/ajax_eventlog.php';

                sendAjax(data, url);
            }, function (e) {
                e.preventDefault();

                alertify.error(LANG[44]);
            });
    };

    // Función para mostrar los botones de acción en los resultados de búsqueda
    var showOptional = function (me) {
        $(me).hide();
        //$(me).parent().css('width','15em');
        //var actions =  $(me).closest('.account-actions').children('.actions-optional');
        var actions = $(me).parent().children('.actions-optional');
        actions.show(250);
    };

    // Función para obtener el tiempo actual en milisegundos
    var getTime = function () {
        var t = new Date();
        return t.getTime();
    };

    // Funciones para analizar al fortaleza de una clave
    // From http://net.tutsplus.com/tutorials/javascript-ajax/build-a-simple-password-strength-checker/
    var checkPassLevel = function (password, dst) {
        var level = zxcvbn(password);

        outputResult(level.score, dst);
    };

    var outputResult = function (level, dstId) {
        var complexity, selector = '.passLevel-' + dstId;

        complexity = $(selector);
        complexity.removeClass("weak good strong strongest");

        if (passwordData.passLength === 0) {
            complexity.attr('title', '').empty();
        } else if (passwordData.passLength < passwordData.minPasswordLength) {
            complexity.attr('title', LANG[11]).addClass("weak");
        } else if (level === 0) {
            complexity.attr('title', LANG[9]).addClass("weak");
        } else if (level === 1 || level === 2) {
            complexity.attr('title', LANG[8]).addClass("good");
        } else if (level === 3) {
            complexity.attr('title', LANG[7]).addClass("strong");
        } else if (level === 4) {
            complexity.attr('title', LANG[10]).addClass("strongest");
        }
    };

    // Función para mostrar mensaje con alertify
    var resMsg = function (type, txt, url, action) {
        if (typeof url !== 'undefined') {
            $.ajax({
                url: url, type: 'get', dataType: 'html', async: false, success: function (data) {
                    txt = data;
                }
            });
        }

        var html;

        txt = txt.replace(/(\\n|;;)/g, "<br>");

        switch (type) {
            case "ok":
                alertify
                    .closeLogOnClick(true)
                    .delay(15000)
                    .success(txt);
                break;
            case "error":
                alertify
                    .closeLogOnClick(true)
                    .delay(15000)
                    .error(txt);
                break;
            case "warn":
                alertify
                    .delay(30000)
                    .log(txt);
                break;
            case "nofancyerror":
                html = '<p class="error round">Oops...<br>' + LANG[1] + '<br>' + txt + '</p>';
                return html;
            default:
                alertify.error(txt);
                break;
        }

        if (typeof action !== "undefined") {
            eval(action);
        }
    };

    // Función para comprobar la conexión con LDAP
    var checkLdapConn = function (formId) {
        var form = '#' + formId;

        var ldapBindPass = $(form).find('[name=ldap_bindpass]').val();

        var data = {
            'type': 'ldap',
            'ldap_server': $(form).find('[name=ldap_server]').val(),
            'ldap_base': $(form).find('[name=ldap_base]').val(),
            'ldap_group': $(form).find('[name=ldap_group]').val(),
            'ldap_binduser': $(form).find('[name=ldap_binduser]').val(),
            'ldap_bindpass': (PK !== '' ) ? encrypt.encrypt(ldapBindPass) : ldapBindPass,
            'isAjax': 1,
            'sk': $(form).find('[name=sk]').val()
        };

        //sendAjax(data, '/ajax/ajax_checkConnection.php');
        sendAjax(data, '/ajax/ajax_checkLatchConn.php');
    };

    // Función para comprobar la conexión con Latch
    var checkLatchConn = function (formId) {
        var form = '#' + formId;

        var data = {
            'type': 'latch',
            'latch_id': $(form).find('[name=latch_id]').val(),
            'latch_secret': $(form).find('[name=latch_secret]').val(),
            'isAjax': 1,
            'sk': $(form).find('[name=sk]').val()
        };

        sendAjax(data, '/ajax/ajax_checkLatchConn.php');
    };

    var checkDokuWikiConn = function (formId) {
        var form = '#' + formId;

        var data = {
            'type': 'dokuwiki',
            'dokuwiki_url': $(form).find('[name=dokuwiki_url]').val(),
            'dokuwiki_user': $(form).find('[name=dokuwiki_user]').val(),
            'dokuwiki_pass': $(form).find('[name=dokuwiki_pass]').val(),
            'isAjax': 1,
            'sk': $(form).find('[name=sk]').val()
        };

        $.ajax({
            type: 'POST',
            url: APP_ROOT + '/ajax/ajax_checkConnection.php',
            data: data,
            success: function (response) {
                if (response.status === 1) {
                    resMsg("error", response.description);
                } else if (response.status === 0) {
                    resMsg("ok", response.description);
                    $('#dokuWikiResCheck').html(response.data);
                }
            }
        });

        //sendAjax(data, 'ajax_checkConnection.php');
    };

    // Función para volver al login
    var goLogin = function () {
        setTimeout(function () {
            location.href = "index.php";
        }, 2000);
    };

    // Función para obtener el navegador usado
    var getBrowser = function () {
        var browser;
        var ua = navigator.userAgent;
        var re = new RegExp("(MSIE|Firefox)[ /]?([0-9]{1,}[.0-9]{0,})", "i");
        if (re.exec(ua) !== null) {
            browser = RegExp.$1;
            //version = parseFloat( RegExp.$2 );
        }

        return browser;
    };

    // Detectar los campos select y añadir funciones
    var chosenDetect = function () {
        var selectWidth = "250px";
        var searchTreshold = 10;

        $(".sel-chosen-usergroup").chosen({
            placeholder_text_single: LANG[21],
            placeholder_text_multiple: LANG[21],
            disable_search_threshold: searchTreshold,
            no_results_text: LANG[26],
            width: selectWidth
        });

        $(".sel-chosen-user").chosen({
            placeholder_text_single: LANG[22],
            placeholder_text_multiple: LANG[22],
            disable_search_threshold: searchTreshold,
            no_results_text: LANG[26],
            width: selectWidth
        });

        $(".sel-chosen-profile").chosen({
            placeholder_text_single: LANG[23],
            placeholder_text_multiple: LANG[23],
            disable_search_threshold: searchTreshold,
            no_results_text: LANG[26],
            width: selectWidth
        });

        $(".sel-chosen-customer").each(function () {
            var deselect = $(this).hasClass('sel-chosen-deselect');

            $(this).chosen({
                allow_single_deselect: deselect,
                placeholder_text_single: LANG[24],
                placeholder_text_multiple: LANG[24],
                disable_search_threshold: searchTreshold,
                no_results_text: LANG[26],
                width: selectWidth
            });
        });

        $(".sel-chosen-category").each(function () {
            var deselect = $(this).hasClass('sel-chosen-deselect');

            $(this).chosen({
                allow_single_deselect: deselect,
                placeholder_text_single: LANG[25],
                placeholder_text_multiple: LANG[25],
                disable_search_threshold: searchTreshold,
                no_results_text: LANG[26],
                width: selectWidth
            });
        });

        $(".sel-chosen-action").each(function () {
            var deselect = $(this).hasClass('sel-chosen-deselect');

            $(this).chosen({
                allow_single_deselect: deselect,
                placeholder_text_single: LANG[39],
                placeholder_text_multiple: LANG[39],
                disable_search_threshold: searchTreshold,
                no_results_text: LANG[26],
                width: selectWidth
            });
        });

        $(".sel-chosen-ns").chosen({disable_search: true, width: selectWidth});
    };

    /**
     * Detectar los imputs del tipo checkbox para generar botones
     *
     * @param container El contenedor donde buscar
     */
    var checkboxDetect = function (container) {
        $(container).find('.checkbox').button({
            icons: {primary: "ui-icon-transferthick-e-w"}
        }).click(
            function () {
                if ($(this).prop('checked') === true) {
                    $(this).button('option', 'label', LANG[40]);
                } else {
                    $(this).button('option', 'label', LANG[41]);
                }
            }
        );
    };

    /**
     * Encriptar el valor de un campo del formulario
     *
     * @param inputId El id del campo
     */
    var encryptFormValue = function (inputId) {
        var input = $(inputId);
        var curValue = input.val();
        var nextName = inputId + '-encrypted';
        var nextInput = input.next(':input[name="' + nextName + '"]');

        if ((curValue !== '' && nextInput.attr('name') !== nextName)
            || (curValue !== '' && nextInput.attr('name') === nextName && parseInt(input.next().val()) !== curValue.length)
        ) {
            var passEncrypted = encrypt.encrypt(curValue);
            input.val(passEncrypted);

            if (nextInput.length > 0) {
                nextInput.val(passEncrypted.length);
            } else {
                input.after('<input type="hidden" name="' + nextName + '" value="' + passEncrypted.length + '" />');
            }
        }
    };

    var initializeClipboard = function () {
        var clipboard = new Clipboard('.clip-pass-button', {
            text: function (trigger) {
                sysPassUtil.Common.viewPass(trigger.getAttribute('data-account-id'), 0);
                return $('#clip-pass-text').html();
            }
        });

        clipboard.on('success', function (e) {
            sysPassUtil.Common.resMsg("ok", LANG[45]);
        });

        clipboard.on('error', function (e) {
            sysPassUtil.Common.resMsg("error", LANG[46]);
        });

        // Portapapeles para claves visualizadas

        // Inicializar el objeto para copiar al portapapeles
        var clipboardPass = new Clipboard(".dialog-clip-pass-button");
        var clipboardUser = new Clipboard(".dialog-clip-user-button");

        clipboardPass.on('success', function (e) {
            $('.dialog-pass-text').addClass('dialog-clip-pass-copy round');
            e.clearSelection();
        });

        clipboardUser.on('success', function (e) {
            e.clearSelection();
        });
    };

    /**
     * Delegar los eventos 'blur' y 'keypress' para que los campos de claves
     * sean encriptados antes de ser enviados por el formulario
     */
    var bindPassEncrypt = function () {
        $('body').delegate(':input[type=password]', 'blur', function (e) {
            var id = $(this).attr('id');
            encryptFormValue('#' + id);
        });

        $('body').delegate(':input[type=password]', 'keypress', function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();

                var form = $(this).closest('form');
                var id = $(this).attr('id');

                encryptFormValue('#' + id);
                form.submit();
            }
        });
    };

    // Función para mostrar los datos de un registro
    var viewWiki = function (pageName, actionId, sk) {

        var data = {'pageName': pageName, 'actionId': actionId, 'sk': sk, 'isAjax': 1};
        var url = APP_ROOT + '/ajax/ajax_wiki.php';

        $.ajax({
            type: 'POST',
            dataType: 'html',
            url: url,
            data: data,
            success: function (response) {
                $.fancybox(response, {padding: [0, 10, 10, 10]});
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var txt = LANG[1] + '<p>' + errorThrown + textStatus + '</p>';
                resMsg("error", txt);
            }
        });
    };

    return {
        accSearch: accSearch,
        accGridAction: accGridAction,
        accGridViewPass: accGridViewPass,
        appMgmtData: appMgmtData,
        appMgmtNav: appMgmtNav,
        appMgmtSave: appMgmtSave,
        appMgmtSearch: appMgmtSearch,
        appMgmtDelete: appMgmtDelete,
        checkboxDetect: checkboxDetect,
        checkDokuWikiConn: checkDokuWikiConn,
        checkLatchConn: checkLatchConn,
        checkLdapConn: checkLdapConn,
        checkPassLevel: checkPassLevel,
        checkUpds: checkUpds,
        clearEventlog: clearEventlog,
        clearSearch: clearSearch,
        chosenDetect: chosenDetect,
        configMgmt: configMgmt,
        delAccount: delAccount,
        delFile: delFile,
        doAction: doAction,
        doLogin: doLogin,
        doLogout: doLogout,
        downFile: downFile,
        dropFile: dropFile,
        encryptFormValue: encryptFormValue,
        getFiles: getFiles,
        importFile: importFile,
        linksMgmtSave: linksMgmtSave,
        linksMgmtRefresh: linksMgmtRefresh,
        navLog: navLog,
        outputResult: outputResult,
        redirect: redirect,
        resMsg: resMsg,
        searchSort: searchSort,
        saveAccount: saveAccount,
        sendAjax: sendAjax,
        sendRequest: sendRequest,
        setContentSize: setContentSize,
        showOptional: showOptional,
        showSearchOrder: showSearchOrder,
        usrUpdPass: usrUpdPass,
        viewFile: viewFile,
        viewPass: viewPass,
        viewWiki: viewWiki,
        passwordData: passwordData,
        passToClip: passToClip,
        APP_ROOT: APP_ROOT,
        LANG: LANG,
        PK: PK
    };
}