// ==UserScript==
// @name         天天基金网基金比较增强
// @namespace    https://github.com/zqbxx/ttfund-enchance
// @version      0.1
// @description  天天基金网基金比较增强
// @author       zqbxx
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js#sha512-894YE6QWD5I59HgZOGReFYm4dnWc1Qt5NtvYSaNcOP+u1T9qYdvdihz0PPSiiqn/+/3e7Jo4EaG7TubfWGUrMQ==
// @require      https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js#sha512=uto9mlQzrs59VwILcLiRYeLKPPbS/bT71da/OEBYEwcdNUk8jYIy+D176RYoop1Da+f9mvkYrmj5MCLZWEtQuA==
// @match        http://fund.eastmoney.com/Compare/
// @icon         https://favor.fund.eastmoney.com/favicon.ico
// @grant        GM_addElement
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

function main() {

    let url = window.location.href;
    let defaultGroupName = '';
    if(url.indexOf("#") != -1) {
        defaultGroupName = decodeURI(window.location.hash.split('#')[1])
    }

    let groupList = $('<select></select>');
    loadGroups(groupList, defaultGroupName);
    groupList.insertBefore('div.header')
    groupList.selectmenu({
        width: 150,
        change: function( event, data ) { selectGroup(data.item.value)}
    });

    let saveBtn = $('<button class="ui-button ui-widget ui-corner-all">保存</button>');
    saveBtn.insertBefore('div.header')
    saveBtn.click(function(event) {
        saveGroup(groupList, false)
    });

    let saveAsBtn = $('<button class="ui-button ui-widget ui-corner-all">另存为</button>');
    saveAsBtn.insertBefore('div.header')
    saveAsBtn.click(function(event){
        saveGroup(groupList, true)
    });

    let delBtn = $('<button class="ui-button ui-widget ui-corner-all">删除</button>');
    delBtn.insertBefore('div.header')
    delBtn.click(function(event){
        let groupName = groupList.find('option:selected').text()
        deleteGroup(groupList, groupName);
    });
}

function saveGroup(groupList, checkExists){

    function save(dialog, groupList, groupName, checkExists){
        let fundWebCompare = localStorage.getItem('fund.web.compare');
        let groups = getGroups();
        if (groups == undefined){
            groups = {}
        }
        if (!checkExists || groups[groupName] == undefined) {
            groups[groupName] = fundWebCompare;
            saveGroups(groups);
            if (dialog != undefined){
                $(dialog).dialog("close").dialog("destroy").remove();
            }
            loadGroups(groupList, groupName);
            groupList.selectmenu("refresh");
            messagebox('成功', '保存成功', 'check');
        } else {
            messagebox('错误', '分组名已存在', 'closethick');
            return;
        }
    }

    let saveGroupDialogDiv = getSaveAsDialogElement();
    let saveGroupDialog = saveGroupDialogDiv.dialog({
        autoOpen: false, height: 220, width: 400, modal: true,
        buttons: [{
                text: "保存",
                click: function() {
                    let groupName = $.trim($(this).find('input[name=name]').val());
                    if (groupName == '') {
                        messagebox('错误', '分组名称不能为空', 'closethick');
                        return;
                    }

                    save(this, groupList, groupName, checkExists)

                }
            },{
                'text': "取消",
                click:function(){
                    $(this).dialog("close").dialog("destory").remove();
                }
           }
        ]
    });
    let groupName = groupList.find('option:selected').text()
    if(groupName == '请选择'){
        saveGroupDialog.dialog( "open" );
    } else {
        if (!checkExists) {
            save(undefined, groupList, groupName, checkExists)
        } else{
        saveGroupDialog.dialog( "open" );
        }
    }

    
}

function deleteGroup(groupList, groupName){
    let groups = getGroups();
    if(groups == undefined)
        return;
    delete groups[groupName];
    saveGroups(groups);
    loadGroups(groupList, '');
    groupList.selectmenu("refresh");
    messagebox('成功', '删除成功', 'check');
}

function selectGroup(groupName) {
    let groups = getGroups();
    if (groups == undefined) {
        return;
    }
    localStorage.setItem('fund.web.compare', groups[groupName]);
    //window.location.reload();
    let url = window.location.href;
    if(url.indexOf("#") != -1) {
        url = window.location.href.split('#')[0];
    }
    window.location = url + '#' + groupName;
    window.location.reload();
}

function saveGroups(groups){
    GM_setValue('groups', JSON.stringify(groups));
}

function loadGroups(groupList, selectedGroupName){
    let groups = getGroups();
    if (groups == undefined)
        return;

    groupList.empty();
    groupList.append('<option disabled>请选择</option>');

    let hasDefaultSelected = false;
    for(let name in groups){
        if(selectedGroupName == name){
            groupList.append('<option selected>' + name + '</option>');
            hasDefaultSelected = true;
        } else {
            groupList.append('<option>' + name + '</option>');
        }
    }

    if(!hasDefaultSelected){
        groupList.find('option:first').attr('selected', true);
    }
}

function getGroupNameFromHash(){
    let url = window.location.href;
    let defaultGroupName = '';
    if(url.indexOf("#") != -1) {
        defaultGroupName = decodeURI(window.location.hash.split('#')[1])
    }
    return defaultGroupName;
}

function getGroups(){
    let groupstr = GM_getValue('groups');
    if (groupstr == undefined){
        return undefined;
    }
    return $.parseJSON(groupstr);
}

function getCookie(name) {
    var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
    if(arr=document.cookie.match(reg))
        return unescape(arr[2]);
    else
        return;
}

function getWebCompare(){
    return localStorage.getItem('fund.web.compare');
}

function getSaveAsDialogElement() {
    return $(`
        <div id="dialog-form" title="设置分组名称">
          <p class="validateTips"></p>
          <form>
            <fieldset>
              <label for="name">名称</label>
              <input type="text" name="name" id="name" value="" class="text ui-widget-content ui-corner-all">
              <input type="submit" tabindex="-1" style="position:absolute; top:-1000px">
            </fieldset>
          </form>
        </div>`);
}

function getAlertDialogElement(title, message) {
    return $(`
        <div id="dialog-confirm" title="">
          <p><span class="ui-icon ui-icon-alert" style="float:left; margin:12px 12px 20px 0;"></span><span id='dialog-confirm-message'></span></p>
        </div>`);
}

function messagebox(title, message, type) {

    let messageboxDiv = $(`
        <div id="dialog-confirm" title="${title}">
          <p>
            <span class="ui-icon ui-icon-${type}" style="float:left; margin:12px 12px 20px 0;"></span>
            <span style="float:left; margin:12px 12px 20px 0;">${message}</span>
          </p>
        </div>`);

    //messageboxDiv.attr('title', title);
    //messageboxDiv.find('#dialog-confirm-message').html(message);
    messageboxDiv.dialog({
        resizable: false, height: "auto", width: 400, modal: true,
        buttons: [{
            "text": '确定',
            click: function(event){
                $(this).dialog("close").dialog("destory").remove();
            }
        }]
    });
}



(function() {
    'use strict';

    GM_addElement('link', {
        //href: 'https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.css',
        href: 'https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/themes/blitzer/jquery-ui.min.css',
        rel: 'stylesheet'
    });

    GM_addStyle(`
    #dialog-form label,#dialog-form input { display:block; }
    #dialog-form input.text { margin-bottom:6px; width:95%; padding: .4em; margin-top:6px}
    #dialog-form fieldset { padding:0; border:0; margin-top:25px; }
    `);

    main()
})();