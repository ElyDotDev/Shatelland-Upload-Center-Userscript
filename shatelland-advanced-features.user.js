// ==UserScript==
// @name         Shatelland Upload Center Advanced Features
// @namespace    http://allii.ir/
// @version      3.5.3
// @description  Add new and advanced features to Shatelland upload center
// @author       Alireza Dabiri Nejad | alireza.dabirinejad@live.com | http://allii.ir
// @include      http*://*shatelland.com/upload*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const ShatellandAdvancedFeaturesMain = function () {
        console.log('Defining constants & variables.');
        /**
         * Leecher item ids list key in LocalStorage
         * @type {string}
         */
        const LEECHER_ITEMS_LIST_KEY = 'leecher_items';

        /**
         * Leecher queue item id list key in LocalStorage
         * @type {string}
         */
        const LEECHER_ITEMS_QUEUE_LIST_KEY = 'leecher_items_queue';

        /**
         * Leecher server id
         * @type {string}
         */
        const LEECHER_SERVER_ID_KEY = 'leecher_server_id';

        /**
         * File status of leecher
         * @type {{NOT_SUBMITTED: number, SUBMIT_ERROR: number, SUBMIT_SUCCESS: number}}
         */
        const LEECH_FILE_STATUS = {
            NOT_SUBMITTED: 1, //SUBMIT_ERROR: 2,
            SUBMIT_SUCCESS: 3
        };

        /**
         * Is FileReader supported in current browser?
         * @type {boolean}
         */
        let isFileReaderSupported = false;

        /**
         * Is current page url contains www.?
         * @type {string}
         */
        let requestUrlPrefix = '';

        /**
         * Is leecher queue being submitted?
         * @type {boolean}
         */
        let isSubmittingLeecherQueue = false;

        /**
         * All the items in leecher.
         * @type {Array}
         */
        let leecherItemsList = [];

        /**
         * Items not submitted to be leeched and are in submitting queue.
         * @type {Array}
         */
        let leecherItemsQueueList = [];

        /**
         * List of direct download links.
         * @type {Array}
         */
        let directDownloadLinksList = [];

        /**
         * Leecher Server Id
         * @type {string}
         */
        let leecherServerId = 'dl1';

        /**
         * Shatelland Leech Servers
         * @type {{dl1: {text: string, address: string, currentUserAddress: string, status: number, interval: number}, dl4: {text: string, address: string, currentUserAddress: string, status: number, interval: number}}}
         */
        const shatellandLeecherServers = {
            dl1: {
                text: 'DL1',
                address: 'https://dl1.shatelland.com/api/Leech',
                currentUserAddress: 'https://dl1.shatelland.com/api/LeechManager/currentuser',
                status: 0,
                interval: 0
            },
            dl4: {
                text: 'DL4',
                address: 'https://dl4.shatelland.com/api/Leech',
                currentUserAddress: 'https://dl4.shatelland.com/api/LeechManager/currentuser',
                status: 0,
                interval: 0
            }
        };

        /**
         * HTML for line separated urls leech button.
         * @type {string}
         */
        const lineSeparatedUrlsLeechButtonHTML = `<a id="line_separated_urls_leech_button" class="btn btn-block">انتقال گروهی لیست فایل</a>`;

        /**
         * HTML for internet download manager (IDM) exported text file to leech button.
         * @type {string}
         */
        const idmExportAsTextToLeechButtonHTML = `<a id="idm_export_as_text_to_leech_button" class="btn btn-block" style="direction: rtl">انتقال گروهی خروجی IDM</a>`;

        /**
         * Manage leech items list button HTML
         * @type {string}
         */
        const manageLeechItemsListButtonHTML = `<a id="manage_leech_items_list_button">مدیریت فهرست ریموت</a>`;

        /**
         *  HTML for line separated urls leech modal.
         * @type {string}
         */
        const lineSeparatedUrlsLeechModalHTML = `
            <div id="line_separated_urls_leech_modal" class="modal fade">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                            <h4 class="modal-title">انتقال گروهی لیست فایل</h4>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="group_upload_files_list_textarea">آدرس فایل ها (در هر خط یک آدرس):</label>
                                <br /><br />
                                <textarea class="form-control" rows="5" name="line_separated_urls_leech_textarea" id="line_separated_urls_leech_textarea" placeholder="Files Address" wrap="soft"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn btn-primary" id="do_line_separated_urls_leech">انتقال فایل ها</button>
                            <button type="button" class="btn btn-default pull-left" data-dismiss="modal">لغو</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        /**
         *  HTML for download manager (IDM) exported text file to leech modal.
         * @type {string}
         */
        const idmExportAsTextToLeechModalHTML = `
            <div id="idm_export_as_text_to_leech_modal" class="modal fade">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                            <h4 class="modal-title">انتقال گروهی خروجی Internet Download Manager</h4>
                        </div>
                        <div class="modal-body">
                            <div class="modal-text-container">
                                میتوانید خروجی نرم افزار Internet Download Manager را بصورت مستقیم برای انتقال فایل استفاده کنید. برای اینکار کافیست فهرست فایل های خود را بصورت text از IDM خروجی بگیرید و پس از ذخیره آن از طریق دکمه ی زیر آنرا برای انتقال انتخاب کنید.
                            </div>
                            <div class="form-group" style="text-align: center">
                                <label class="btn btn-primary btn-file" style="direction: rtl">انتخاب خروجی IDM | فرمت قابل قبول: txt<input type="file" id="idm_export_as_text_to_leech_input" style="display: none;"></label>
                            </div>
                            <div id="chosen_idm_export_as_text_to_leech_file_name" class="bg-info">فایل انتخاب شده: هیچ فایلی انتخاب نشده است.</div>
                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn btn-primary" id="do_idm_export_as_text_to_leech">انتقال فایل ها</button>
                            <button type="button" class="btn btn-default pull-left" data-dismiss="modal">لغو</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        /**
         * HTML for manage leech items list modal.
         */
        const manageLeechItemsListModalHTML = `
            <div id="manage_leech_items_list_modal" class="modal fade">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                            <h4 class="modal-title">مدیریت فهرست ریموت</h4>
                        </div>
                        <div class="modal-body">
                            <table class="table table-striped table-hover" id="leech_items_list_table">
                                <thead>
                                <tr>
                                    <td>اندیس</td>
                                    <td>نام فایل</td>
                                    <td>وضعیت</td>
                                    <td>عملیات</td>
                                </tr>
                                </thead>
                                <tbody id="leech_items_list_table_tbody">
                                </tbody>
                            </table>
                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn btn-primary" id="clear_leech_items_list">پاک کردن فهرست</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        /**
         * HTML for direct download selected items button.
         * @type {string}
         */
        const directDownloadSelectedItemsButtonHtml = '<button id="direct_download_selected_items" class="btn btn-info"  data-original-title="" title=""><i class="glyphicon glyphicon-download"></i></button>';

        /**
         * HTML for direct download link of selected items button.
         * @type {string}
         */
        const directDownloadLinkOfSelectedItemsButtonHtml = '<button id="direct_download_link_of_selected_items" class="btn btn-info"  data-original-title="" title=""><i class="glyphicon glyphicon-list"></i></button>';

        /**
         *  HTML for line separated urls leech modal.
         * @type {string}
         */
        const directDownloadLinkOfSelectedItemsModalHtml = `
            <div id="direct_download_link_of_selected_items_modal" class="modal fade">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                            <h4 class="modal-title">لینک مستقیم فایل ها انتخاب شده</h4>
                        </div>
                        <div class="modal-body">
                            <ul class="nav nav-tabs nav-rtl">
                                <li class="active"><a data-toggle="tab" href="#direct_download_link_listular">فهرست</a></li>
                                <li><a data-toggle="tab" href="#direct_download_link_textular">متن</a></li>
                            </ul>
            
                            <div class="tab-content">
                                <div id="direct_download_link_listular" class="tab-pane fade in active">
                                    <br /><br />
                                    <table class="table table-striped table-hover">
                                        <thead>
                                        <tr>
                                            <td>آدرس</td>
                                        </tr>
                                        </thead>
                                        <tbody id="direct_download_links_list_tbody">
                                        </tbody>
                                    </table>
                                </div>
                                <div id="direct_download_link_textular" class="tab-pane fade">
                                    <br /><br />
                                    <textarea class="form-control" rows="5" name="direct_download_links_list_textarea" id="direct_download_links_list_textarea" wrap="soft"></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn btn-primary" id="do_get_direct_download_list_export_to_txt">دریافت خروجی txt</button>
                            <button type="button" class="btn btn-default pull-left" data-dismiss="modal">لغو</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        /**
         * HTML for refresh file manager button.
         * @type {string}
         */
        const refreshFileManagerButtonHtml = '<button id="refresh_file_manager" class="btn btn-info"  data-original-title="" title=""><i class="glyphicon glyphicon-refresh"></i></button>';

        /**
         * HTML for share Folder page direct download of all files.
         * @type {string}
         */
        const shareFolderDirectDownloadAllFilesHTML = `<button id="sharefolder_direct_download_of_all_files_button" class="btn btn-info"  data-original-title="" title=""><i class="glyphicon glyphicon-download"></i> دانلود مستقیم تمام فایل ها</button>`;

        /**
         * HTML for share Folder page direct download of all files.
         * @type {string}
         */
        const shareFolderDirectDownloadAllFilesAsLinkHTML = `<button id="sharefolder_direct_download_of_all_files_as_link_button" class="btn btn-info"  data-original-title="" title=""><i class="glyphicon glyphicon-list"></i> لینک مستقیم تمام فایل ها</button>`;

        /**
         * HTML for share Folder page direct download of all files.
         * @type {string}
         */
        const shareFolderDirectDownloadLinkOfItemLinkHTML = `<a href="#" class="btn btn-success direct-download-item">دانلود مستقیم</a>`;

        /**
         * Extra leecher manager button HTML
         * @type {string}
         */
        const extraLeecherManagerButtonHTML = `<a id="extra_leecher_manager_button" href="#">لیچر</a>`;

        /**
         *  HTML for Extra leecher manager modal.
         * @type {string}
         */
        const extraLeecherManagerModalHtml = `
            <div id="extra_leecher_manager_modal" class="modal fade">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                            <h4 class="modal-title">لیچر</h4>
                        </div>
                        <div class="modal-body">
                            <ul class="nav nav-tabs nav-rtl">
                                <li class="active"><a data-toggle="tab" href="#instagram_leecher">ویدیو اینستاگرام</a></li>
                            </ul>
            
                            <div class="tab-content">
                                <div id="instagram_leecher" class="tab-pane fade in active">
                                    <div class="modal-text-container">
                                        <br/>آدرس پست شامل ویدیو اینستاگرام را وارد کنید. در دسکتاپ همان URL صفحه می باشد. در موبایل متن "<strong>Share URL</strong>" پست میباشد.
                                        <br/><strong>نمونه: </strong>https://www.instagram.com/p/BDin77DxtAH
                                    </div>
                                    <div class="form-group">
                                        <input type="text" class="form-control text-left" id="instagram_leecher_input" id="" placeholder="Instagram Share URL" style="direction: ltr"/>
                                    </div>
                                    <div class="form-group text-center">
                                        <button type="submit" class="btn btn-primary" id="do_instagram_leech">شروع کن!</button>
                                    </div>
                                    <div id="instagram_leecher_status"></div>
                                </div>
                                
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-default pull-left" data-dismiss="modal">لغو</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        /**
         * Leecher Servers select and status
         * @type {string}
         */
        const leecherServersSelectAndStatusHTML = `<div id="leecher_servers_select_wrapper"  class="btn-group" style="direction: ltr" data-toggle="buttons">انتخاب سرور</div>`;

        /**
         * Current Leccher files percentage and cancle manager HTML.
         * @type {string}
         */
        const currentLeecherServerFilesManagerHtml = `<div id="current_leecher_server_files_manager"></div>`;

        /**
         * Setup all ajax requests.
         */
        $.ajaxSetup({
            cache: true,
            xhrFields: { withCredentials: true }
        });

        /**
         * Load Store.js
         *
         * Store.js used as a LocalStorage wrapper to use LocalStorage.
         */
        console.log('Loading Store.js');
        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/store.js/1.3.20/store.min.js', function () {
            storeJsLoaded();
        });

        /**
         * Loading Filesaver.js
         */
        console.log('Loading Filesaver.js');
        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js');

        /**
         * Loading circle-progress.js
         */
        console.log('Loading circle-progress.js');
        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-circle-progress/1.2.2/circle-progress.min.js', function () {
            renderCurrentLeecherServerFilesManager();
        });

        /**
         * Loading Clipboard.js
         */
        console.log('Loading clipboard.js');
        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.7.1/clipboard.min.js', function () {
            new Clipboard('.copy-button');
        });

        /**
         * Add custom styles as a style tag to page head.
         */
        console.log('Adding custom styles.');
        $('head').append($('<style/>').html(`
                #line_separated_urls_leech_textarea, #direct_download_links_list_textarea {
                    width: 100%;
                    min-height: 200px;
                    resize: none;
                    direction: ltr;
                    font-size: 11px;
                    overflow-x: hidden;
                    padding: 10px;
                    line-height: 200%;
                    white-space: pre;
                    overflow-wrap: normal;
                }
                
                .modal-text-container {
                    line-height: 200%;
                    color: #999;
                    font-size: 13px;
                    margin-bottom: 10px;
                }
                
                #chosen_idm_export_as_text_to_leech_file_name {
                    padding: 10px;
                    font-size: 14px;
                    color: #666
                }
                
                #manage_leech_items_list_button {
                    position: fixed;
                    bottom: 0;
                    right: 20px;
                    background: #3F51B5;
                    color: #fff;
                    padding: 10px;
                    font-size: 14px;
                }
                
                .modal-body {
                    max-height: 400px;
                    overflow: auto;
                    max-width: 100%;
                }
                
                #manage_leech_items_list_modal .modal-dialog, #direct_download_link_of_selected_items_modal .modal-dialog {
                    width: 950px;
                }
                
                #leech_items_list_table {
                    width: 100%;
                    max-width: 100%;
                }
                
                table {
                    counter-reset: rowNumber;
                }
                
                table #leech_items_list_table_tbody tr {
                    counter-increment: rowNumber;
                }
                
                table #leech_items_list_table_tbody tr td:first-child::before {
                    content: counter(rowNumber);
                    min-width: 1em;
                    margin-right: 0.5em;
                }
                
                #leech_items_list_table td {
                    white-space: nowrap;
                    overflow: hidden;
                }
                
                .file-direct-download-iframe {
                    display: none;
                }
                
                #sharefolder_direct_download_of_all_files_button, #sharefolder_direct_download_of_all_files_as_link_button {
                    display: block;
                    width: 100%;
                    font-size: 16px;
                    margin-bottom: 10px;
                }
                
                .nav-rtl {
                    padding-left:40px;
                    padding-right:0px;
                }
                
                .nav-rtl li {
                    float:right;
                }
                
                .folders-tree {
                    max-height: calc(100vh - 90px - 150px - 61px - 30px - 100px) !important;
                }
                
                #extra_leecher_manager_button {
                    position: fixed;
                    bottom: 0;
                    right: 170px;
                    background: #1A237E;
                    color: #fff;
                    padding: 10px;
                    font-size: 14px;
                }
                
                .glyphicon-refresh-animate {
                    -animation: spin 1s infinite linear;
                    -webkit-animation: spin2 1s infinite linear;
                }
                
                @-webkit-keyframes spin2 {
                    from { -webkit-transform: rotate(0deg);}
                    to { -webkit-transform: rotate(360deg);}
                }
                
                @keyframes spin {
                    from { transform: scale(1) rotate(0deg);}
                    to { transform: scale(1) rotate(360deg);}
                }
                
                #leecher_servers_select_wrapper {
                    position: fixed;
                    bottom: 0;
                    right: 220px;
                    font-size: 14px;
                }
                
                #leecher_servers_select_wrapper.btn-group>.btn {
                    border-radius: 0px!important;
                    padding: 10px 12px!important;
                    border: 0!important;
                    
                }
                
                .refresh-server-statuses {
                    background: #f0f0f0;
                }
                
                .upload-queue {
                    right: auto!important;
                    left: 20px!important;
                }
                
                .leech-box {
                    /*
                    right: 337px!important;
                    bottom: -1px!important;
                    width: 100px!important;
                    min-width: 320px!important;
                    margin: 0!important;
                    font-size: 0px;
                    padding: 5px 5px!important;
                    border-radius: 0px;
                    background: #f0f0f0;
                    border: 0px !important;
                    */
                }
                
                /*
                .leech-box input {
                    display: block!important;
                    width: 52%!important;
                    padding: 0 5px;
                    border: 1px solid #CDCDCD;
                    border-radius: 3px;
                    font-size: 10px!important;
                    float: right;
                }
                
                .leech-box .btn-hide-currentLeech {
                    margi-top: 0px!important;
                    display: block;
                    width: 20%;
                    float: left;
                    margin-top: 0!important;
                }
                
                .leech-box .percent {
                    font-size: 10px!important;
                    width: 25%;
                    display: block!important;
                    float: right;
                    margin: 0px!important;
                    margin-right: 3%!important;
                    padding-top: 3px;
                }
                */
                
                .file-manager-container .file-manager-holder .files-list {
                    max-height: calc(100vh - 233px) !important;
                }
                
                .uploadQueue-header {
                    border-radius: 0px!important;
                }
                
                #current_leecher_server_files_manager {
                    position: fixed;
                    background: #f0f0f0;
                    height: 40px;
                    width: 506px;
                    right: 383px;
                    bottom: 0;
                    box-sizing: border-box;
                }
                
                #current_leecher_server_files_manager .leecher-server {
                    float: right;
                    width: 253px;
                    height: 40px;
                    box-sizing: border-box;
                    position: relative;
                }
               
                
                .server-id {
                    float: left;
                    font-size: 10px;
                    background: #0681c4;
                    color: #fff;
                    padding: 15px 5px;
                    font-weight: bold;
                }
                
                .no-file-status {
                    direction: rtl;
                    text-align: right;
                    float: left;
                    width: 210px;
                    margin: 0 5px;
                    color: #aaa;
                    font-size: 14px;
                    height: 40px;
                    padding-top: 11px;
                    display: none;
                }
                
                .file-address {
                    float: left;
                    width: 173px;
                    margin: 0 5px;
                }
                
                .file-address-input {
                    border: 0;
                    background: #f0f0f0;
                    color: #666;
                    direction: ltr;
                    text-align: left;
                    font-size: 10px;
                    width: 100%;
                    height: 40px;
                    padding-top: 5px;
                }
                
                .animated-button {
                    position: absolute;
                    top: -40px;
                    right: 0;
                    width: 76px;
                    height: 40px;
                    display: none;
                }
                
                .cancle-button {
                    float: right;
                    padding: 10px;
                    font-size: 18px;
                    color: #fff;
                    background: #ff1e41;
                    cursor: pointer;
                    box-sizing: border-box;
                    height: 40px;
                }
                
                .cancle-button:hover {
                   background: #ff5f43;
                }
                
                .copy-button {
                    float: right;
                    padding: 10px;
                    font-size: 18px;
                    color: #fff;
                    background: #0681c4;
                    cursor: pointer;
                    box-sizing: border-box;
                    height: 40px;
                }
                
                .copy-button:hover {
                   background: #4ac5f8;
                }
                
                .total-size {
                    float: right;
                    direction: ltr;
                    font-size: 11px;
                    padding: 15px 5px;
                    color: #999;
                    display: none;
                }
                
                .circle-progress {
                    float: right;
                    padding: 6px 5px 0 5px;
                    position: relative;
                    width: 30px;
                    margin-left: 8px;
                }
                
                .circle-progress span {
                    position: absolute;
                    top: 16px;
                    left: 4px;
                    font-size: 9px;
                    text-align: center;
                    width: 11px;
                    color: #999;
                }
                
                .tooltip {
                    font-family: 'BYekan',Verdana,Tahoma,Arial;
                }
                
                input:focus,
                select:focus,
                textarea:focus,
                button:focus {
                    outline: none;
                }
                
                #current_leecher_server_files_manager .leecher-server.no-file .current-file-data {
                    display: none;
                }
                
                #current_leecher_server_files_manager .leecher-server.no-file .no-file-status {
                    display: block;
                }
            `));

        console.log('Check FileReader support in current browser.');
        /**
         * Check FileReader support in current browser.
         */
        if (window.FileReader && window.File && window.FileList && window.Blob) {
            isFileReaderSupported = true;
        }

        /**
         * Check https or http?
         */
        const urlParser = document.createElement('a');
        urlParser.href = window.location.href;
        /* No needed any more. The site redirected to https by default.
        if (urlParser.protocol == 'http:') {
            window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
        }
        */

        /**
         * Check url contains www or not?
         */
        if (urlParser.origin.includes('www.')) {
            requestUrlPrefix = 'www.';
        }

        /**
         * Start leech queue submit.
         */
        setInterval(function () {
            console.log('Try to start leech queue submit.');
            if (!isSubmittingLeecherQueue) {
                isSubmittingLeecherQueue = true;
                startLeechQueueSubmit();
                //handleCurrentLeecherServersFileStatus();
            }
        }, 1000);

        console.log('Get common jQuery objects.');
        /**
         * Get common jQuery objects
         */
        const $body = $('body');
        const $sidebarForm = $('.uploadPage-sidebar form');
        const $actionModals = $('.actions-modal');
        const $BtnNewFolder = $('.btn-newFolder');
        const $shareFolderTheFileHr = $('.the-file hr');

        console.log('Inject custom UI elements to page.');
        /**
         * Inject line separated urls leech button.
         */
        $sidebarForm.append(lineSeparatedUrlsLeechButtonHTML);

        /**
         * Inject internet download manager (IDM) exported text file to leech button.
         */
        if (isFileReaderSupported) {
            $sidebarForm.append(idmExportAsTextToLeechButtonHTML);
        }

        /**
         * Inject line separated urls leech modal.
         */
        $actionModals.append(lineSeparatedUrlsLeechModalHTML);

        /**
         * Inject internet download manager (IDM) exported text file to leech modal.
         */
        if (isFileReaderSupported) {
            $actionModals.append(idmExportAsTextToLeechModalHTML);
        }

        /**
         * Inject manage leech items list button.
         */
        $actionModals.append(manageLeechItemsListButtonHTML);

        /**
         * Inject manage leech items list modal.
         */
        $actionModals.append(manageLeechItemsListModalHTML);

        /**
         * Inject direct download link.
         */
        $actionModals.append(directDownloadLinkOfSelectedItemsModalHtml);

        /**
         * Inject direct download selected items.
         */
        $BtnNewFolder.before(directDownloadSelectedItemsButtonHtml);

        /**
         * Inject direct download link of selected items.
         */
        $BtnNewFolder.before(directDownloadLinkOfSelectedItemsButtonHtml);

        /**
         * Inject refresh file manager button.
         */
        $BtnNewFolder.before(refreshFileManagerButtonHtml);

        /**
         * Inject share folder page all files direct download.
         */
        $shareFolderTheFileHr.after(shareFolderDirectDownloadAllFilesAsLinkHTML);

        /**
         * Inject share folder page all files direct download.
         */
        $shareFolderTheFileHr.after(shareFolderDirectDownloadAllFilesHTML);

        /**
         * Inject share folder page all files direct download links.
         */
        $body.append(directDownloadLinkOfSelectedItemsModalHtml);

        /**
         * Inject Extra leecher Manager Button
         */
        $actionModals.append(extraLeecherManagerButtonHTML);

        /**
         * Inject Leecher Servers Select and status.
         */
        $actionModals.append(leecherServersSelectAndStatusHTML);

        /**
         * Inject Extra leecher manager modal
         */
        $actionModals.append(extraLeecherManagerModalHtml);

        /**
         * Inject direct download link of sharefolder each items
         */
        $('.the-file ul li').each(function () {
            const directDownloadLinkURL = $(this).find('a').attr('href'),
                directDownloadLink = $(shareFolderDirectDownloadLinkOfItemLinkHTML).attr('href', directDownloadLinkURL),
                downloadItemIndex = $(this).find('.btn-info');
            $(this).find('.btn-group').prepend(directDownloadLink);
            $(this).find('.btn-group').prepend(downloadItemIndex);
        });

        console.log('Register UI elements events.');
        /**
         * Click on line separated urls leech button event.
         */
        $body.on('click', '#line_separated_urls_leech_button', function () {
            console.log('Open line separated urls leech modal.');
            var $lineSeparatedUrlsLeechModal = $('#line_separated_urls_leech_modal');
            $lineSeparatedUrlsLeechModal.on('shown.bs.modal', function () {
                $('#line_separated_urls_leech_textarea').focus();
            });
            $lineSeparatedUrlsLeechModal.modal('show');
        });

        /**
         * Focus on single leech input text
         */
        $('.leech-modal').on('shown.bs.modal', function () {
            $('#fileAddress').select();
        });

        /**
         * Focus on new folder input text
         */
        $('.new-folder-modal').on('shown.bs.modal', function () {
            $('#folderName').select();
        });

        /**
         * Focus on rename input text
         */
        $('.rename-modal').on('shown.bs.modal', function () {
            $('#fileName').select();
        });

        /**
         * Click on internet download manager (IDM) exported text file to leech button event.
         */
        $body.on('click', '#idm_export_as_text_to_leech_button', function () {
            console.log('Open internet download manager (IDM) exported text file to leech modal.');
            $('#idm_export_as_text_to_leech_modal').modal('show');
        });

        /**
         * Submit line separated urls leech event.
         */
        $body.on('click', '#do_line_separated_urls_leech', function () {
            console.log('Submit line separated urls leech.');
            submitLineSeparatedUrlsLeechTextarea();
        });

        /**
         * Submit internet download manager (IDM) exported text file to leech event.
         */
        $body.on('click', '#do_idm_export_as_text_to_leech', function () {
            console.log('Submit internet download manager (IDM) exported text file to leech.');
            submitIdmExportAsTextToLeechInput();
        });

        /**
         * Choose internet download manager (IDM) exported text file change input event.
         */
        $body.on('change', '#idm_export_as_text_to_leech_input', function () {
            const file = $('#idm_export_as_text_to_leech_input').get(0).files[0];
            if (file) {
                $('#chosen_idm_export_as_text_to_leech_file_name').html('فایل انتخاب شده: ' + file.name);
            }
        });

        /**
         * Click on manage leech items list button event.
         */
        $body.on('click', '#manage_leech_items_list_button', function () {
            console.log('Open manage leech items list modal.');
            $('#manage_leech_items_list_modal').modal('show');
        });

        /**
         * Click on clear leech items list event.
         */
        $body.on('click', '#clear_leech_items_list', function () {
            console.log('Clear leech items list.');
            doClearLeechItemsList();
        });

        /**
         * Click on remove item form leech items list event.
         */
        $body.on('click', '.remove-item-from-leech-items-list', function (event) {
            const itemGUID = $(event.currentTarget).attr('data-guid');
            console.log('Remove leech item form items list: ' + itemGUID);
            store.remove(itemGUID);
            removeItemFromLeechItemsList(itemGUID);
            removeItemFromLeechItemsQueueList(itemGUID);
            renderManageLeechItemsListTable();
        });

        /**
         * Click on add item to leech items queue event.
         */
        $body.on('click', '.add-item-to-leech-items-queue-again', function (event) {
            const itemGUID = $(event.currentTarget).attr('data-guid');
            console.log('Add item to leech items queue list again: ' + itemGUID);
            const item = store.get(itemGUID);
            if (item) {
                item.status = 1;
                store.set(itemGUID, item);
                leecherItemsQueueList.unshift(itemGUID);
                store.set(LEECHER_ITEMS_QUEUE_LIST_KEY, leecherItemsQueueList);
            }
            renderManageLeechItemsListTable();
        });

        /**
         * Click on direct download selected items button event.
         */
        $body.on('click', '#direct_download_selected_items', function () {
            console.log('Handle direct download selected items');
            handleDirectDownloadSelectedItems();
        });

        /**
         * Click on get direct download list export to txt.
         */
        $body.on('click', '#do_get_direct_download_list_export_to_txt', function () {
            console.log('Export to text file direct download list.');
            const blob = new Blob([directDownloadLinksList.join('\n')], { type: 'text/plain;charset=utf-8' });
            saveAs(blob, generateGUID() + '.txt');
        });

        /**
         * Click on direct download link of selected items button event.
         */
        $body.on('click', '#direct_download_link_of_selected_items', function () {
            console.log('Handle direct download link of selected items');
            $('#direct_download_link_of_selected_items_modal').modal('show');
            directDownloadLinksList = [];
            handleDirectDownloadLinkOfSelectedItems();
        });

        /**
         * Click on direct download selected items button event.
         */
        $body.on('click', '#refresh_file_manager', function () {
            console.log('Refresh file manager.');
            handleRefreshUsedSpace();
            handleRefreshFileManager();
        });

        /**
         * Click on share folder direct download of all files button event.
         */
        $body.on('click', '#sharefolder_direct_download_of_all_files_button', function () {
            console.log('Handle share folder direct download of all files.');
            handleShareFolderDirectDownloadOfAllFiles();
        });

        /**
         * Click on direct download link of sharefolder all files.
         */
        $body.on('click', '#sharefolder_direct_download_of_all_files_as_link_button', function () {
            console.log('Handle share folder direct download link of all items.');
            $('#direct_download_link_of_selected_items_modal').modal('show');
            directDownloadLinksList = [];
            handleShareFolderDirectDownloadLinkOfAllFiles();
        });

        /**
         * Click on direct download link of one item in share folder.
         */
        $body.on('click', '.direct-download-item', function (event) {
            event.preventDefault();
            console.log('Handle direct download of one item in sharefolder.');
            handleShareFolderDirectDownloadOfItem($(event.currentTarget).attr('href'));
        });

        /**
         * Click on extra leecher manager button.
         */
        $body.on('click', '#extra_leecher_manager_button', function (event) {
            event.preventDefault();
            console.log('Extra leecher manager opening.');
            $('#extra_leecher_manager_modal').modal('show');
        });

        /**
         * Handle instagram leech button click
         */
        $body.on('click', '#do_instagram_leech', function (event) {
            event.preventDefault();
            $(this).attr('disabled', 'disabled');
            handleInstagramLeech();
        });

        /**
         * Handle leecher server click on button
         */
        $body.on('click', '.leecher-server-button', function (event) {
            event.preventDefault();
            console.log('Handle Leecher Server Button Click');
            handleLeecherServerSelect($(event.target).attr('data-id'));
        });

        /**
         * Handle leecher server status refresh click
         */
        $body.on('click', '.refresh-server-statuses', function (event) {
            event.preventDefault();
            console.log('Refresh leecher server statuses');
            const $this = $(this);

            $this.find('i').addClass('glyphicon-refresh-animate ');
            setTimeout(function () {
                checkServerStatuses(function () {
                    $this.find('i').removeClass('glyphicon-refresh-animate ');
                });
            }, 500);
        });

        /**
         * Handle mouseover on leech server status manager box
         */
        $body.on('mouseover', '.leecher-server', function () {
            if (!$(this).hasClass('no-file')) {
                $(this).find('.animated-button').stop().fadeTo(300, 1);
            }
        });

        /**
         * Handle mouseout on leech server status manager box
         */
        $body.on('mouseout', '.leecher-server', function () {
            $(this).find('.animated-button').stop().fadeTo(200, 0);
        });

        /**
         * Handle cancle the leech server file leeching
         */
        $body.on('click', '.cancle-button', function () {
            const server_id = $(this).attr('data-id');
            if (shatellandLeecherServers.hasOwnProperty(server_id)) {
                $.get(shatellandLeecherServers[server_id].currentUserAddress + '/cancel').then(function () {
                    handleCurrentLeecherServersFileStatus(server_id);
                }).fail(function (e) {
                    console.log(e);
                });
            }
        });

        /**
         * All the functionality that we needed.
         */

        /**
         * When StoreJS loaded, Retrieve saved data form LocalStorage
         */
        function storeJsLoaded() {
            console.log('Store.js loaded.');

            console.log('Retrieve leecher items list.');
            if (store.get(LEECHER_ITEMS_LIST_KEY)) {
                leecherItemsList = store.get(LEECHER_ITEMS_LIST_KEY);
            } else {
                store.set(LEECHER_ITEMS_LIST_KEY, leecherItemsList);
            }

            console.log('Retrieve leecher items queue list.');
            if (store.get(LEECHER_ITEMS_QUEUE_LIST_KEY)) {
                leecherItemsQueueList = store.get(LEECHER_ITEMS_QUEUE_LIST_KEY);
            } else {
                store.set(LEECHER_ITEMS_QUEUE_LIST_KEY, leecherItemsQueueList);
            }

            console.log('Retrieve leecher server id.');
            if (store.get(LEECHER_SERVER_ID_KEY)) {
                leecherServerId = store.get(LEECHER_SERVER_ID_KEY);
            } else {
                store.set(LEECHER_SERVER_ID_KEY, 'dl1');
            }
            checkServerStatuses();

            renderManageLeechItemsListTable();
        }

        /**
         * Generate GUID
         * @returns {string}
         */
        function generateGUID() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        }

        /**
         * Convert line separated urls string to array.
         * @param lineSeparatedUrls
         * @returns {Array}
         */
        function convertLineSeparatedUrlsToArray(lineSeparatedUrls) {
            if (typeof lineSeparatedUrls == 'string') {
                return lineSeparatedUrls.split('\n');
            }

            return [];
        }

        /**
         * Get current folder id using the window location
         * @returns {number}
         */
        function getCurrentFolderId() {
            let urlParser = document.createElement('a'), folderId = 0;
            urlParser.href = window.location.href;
            if (urlParser.hash !== '#/home') {
                const urlPaths = urlParser.hash.split('/');
                folderId = urlPaths[urlPaths.length - 1];
            }

            return folderId;
        }

        /**
         * Add array of urls to leech list
         * @param urlsArray {Array}
         * @param callback {function}
         */
        function addUrlsArrayToLeechList(urlsArray, callback) {
            const currentFolderId = getCurrentFolderId();

            for (let urlIndex in urlsArray) {
                if (urlsArray.hasOwnProperty(urlIndex)) {
                    if (typeof urlsArray[urlIndex] == 'string' && urlsArray[urlIndex] !== '') {
                        console.log('Add url to leech list: ' + urlsArray[urlIndex]);
                        const file = {
                            url: urlsArray[urlIndex],
                            folderId: currentFolderId,
                            status: LEECH_FILE_STATUS.NOT_SUBMITTED
                        };

                        let fileNotAdded = true;
                        let fileGUID = '';
                        while (fileNotAdded) {
                            fileGUID = generateGUID();
                            if (!store.get(fileGUID)) {
                                store.set(fileGUID, file);
                                leecherItemsList.push(fileGUID);
                                leecherItemsQueueList.unshift(fileGUID);
                                store.set(LEECHER_ITEMS_LIST_KEY, leecherItemsList);
                                store.set(LEECHER_ITEMS_QUEUE_LIST_KEY, leecherItemsQueueList);
                                fileNotAdded = false;
                            }
                        }
                        console.log('File Added Successfully: ' + fileGUID);
                    }
                }
            }
            renderManageLeechItemsListTable();
            callback();
        }

        /**
         * Submit line separated urls to leech textarea
         */
        function submitLineSeparatedUrlsLeechTextarea() {
            const $lineSeparatedUrlsLeechTextarea = $('#line_separated_urls_leech_textarea');
            const lineSeparatedUrlsLeechTextareaValue = $lineSeparatedUrlsLeechTextarea.val();
            if (lineSeparatedUrlsLeechTextareaValue) {
                const lineSeparatedUrlsLeechArray = convertLineSeparatedUrlsToArray(lineSeparatedUrlsLeechTextareaValue);
                console.log('Add urls array from line separated urls leech textarea.');
                addUrlsArrayToLeechList(lineSeparatedUrlsLeechArray, function () {
                    $lineSeparatedUrlsLeechTextarea.val('');
                    $('#line_separated_urls_leech_modal').modal('hide');
                    noty({
                        text: 'فایل ها برای انتقال ارسال شد.'
                    });
                });
            }
        }

        /**
         * Submit internet download manager (IDM) exported text file to leech input
         */
        function submitIdmExportAsTextToLeechInput() {
            const $idmExportAsTextToLeechInput = $('#idm_export_as_text_to_leech_input'),
                idmExportAsTextToLeechFile = $idmExportAsTextToLeechInput.get(0).files[0],
                fileReader = new FileReader(), fileExtensionRegex = /(?:\.([^.]+))?$/;

            fileReader.onload = function (event) {
                const lineSeparatedUrlsLeechArray = convertLineSeparatedUrlsToArray(event.target.result);
                console.log('Add urls array from internet download manager (IDM) exported text file to leech input.');
                addUrlsArrayToLeechList(lineSeparatedUrlsLeechArray, function () {
                    $idmExportAsTextToLeechInput.val('');
                    $('#idm_export_as_text_to_leech_modal').modal('hide');
                    noty({
                        text: 'فایل ها برای انتقال ارسال شد.'
                    });
                });

            };

            if (idmExportAsTextToLeechFile) {
                console.log('Check internet download manager (IDM) exported text file to leech input file is txt.');
                if (fileExtensionRegex.exec(idmExportAsTextToLeechFile.name)[1] == 'txt') {
                    console.log('Internet download manager (IDM) exported text file to leech input file is txt.');
                    fileReader.readAsText(idmExportAsTextToLeechFile);
                } else {
                    noty({
                        text: 'فرمت فایل انتخاب شده نادرست است.',
                        type: 'error'
                    });
                }
            } else {
                noty({
                    text: 'فایل خروجی IDM انتخاب نشده است.',
                    type: 'error'
                });
            }
        }

        /**
         * Render manage leech items list table.
         */
        function renderManageLeechItemsListTable() {
            const $leechItemsListTableTbody = $('#leech_items_list_table_tbody');
            $leechItemsListTableTbody.html('');
            for (let leechItemIndex in leecherItemsList) {
                const uploadGUID = leecherItemsList[leechItemIndex];
                const upload = store.get(uploadGUID);
                let uploadHTML = '<tr><td></td><td style="max-width:650px; overflow:auto;">' + upload.url + '</td>';
                if (upload.status == LEECH_FILE_STATUS.NOT_SUBMITTED) {
                    uploadHTML += '<td>در صف ارسال</td>';
                    uploadHTML += '<td><span data-guid="' + uploadGUID + '" class="btn btn-primary remove-item-from-leech-items-list">حذف</span></td>';
                } else if (upload.status == 2) {
                    //uploadHTML += '<td>خطا در ارسال</td>';
                    //uploadHTML += '<td><span data-guid="' + uploadGUID + '" class="btn btn-primary add-item-to-leech-items-queue-again">دوباره</span></td>';

                }
                if (upload.status == LEECH_FILE_STATUS.SUBMIT_SUCCESS) {
                    uploadHTML += '<td>ارسال شده</td>';
                    uploadHTML += '<td><span data-guid="' + uploadGUID + '" class="btn btn-primary remove-item-from-leech-items-list">حذف</span> <span data-guid="' + uploadGUID + '" class="btn btn-primary add-item-to-leech-items-queue-again">دوباره</span></td>';
                }
                uploadHTML += '</tr>';
                $leechItemsListTableTbody.prepend(uploadHTML);
            }
        }

        /**
         * Clear leech items list.
         */
        function doClearLeechItemsList() {
            console.log('Leech items list cleared.');
            store.clear();
            leecherItemsList = [];
            store.set(LEECHER_ITEMS_LIST_KEY, []);
            leecherItemsQueueList = [];
            store.set(LEECHER_ITEMS_QUEUE_LIST_KEY, []);
            renderManageLeechItemsListTable();
        }

        /**
         * Remove an item from leech items list
         */
        function removeItemFromLeechItemsList(itemGUID) {
            const index = leecherItemsList.indexOf(itemGUID);
            if (index > -1) {
                leecherItemsList.splice(index, 1);
                store.set(LEECHER_ITEMS_LIST_KEY, leecherItemsList);
            }
        }

        /**
         * Remove an item from leech items queue list
         */
        function removeItemFromLeechItemsQueueList(itemGUID) {
            const index = leecherItemsQueueList.indexOf(itemGUID);
            if (index > -1) {
                leecherItemsQueueList.splice(index, 1);
                store.set(LEECHER_ITEMS_QUEUE_LIST_KEY, leecherItemsQueueList);
            }
        }

        /**
         * Start leech queue submit.
         */
        function startLeechQueueSubmit() {
            console.log('Starting leech queue submit.');
            if (leecherItemsQueueList.length > 0) {
                const itemGUID = leecherItemsQueueList[0];
                const item = store.get(itemGUID);
                if (item) {
                    submitItemToLeecher(item.url, item.folderId, function (error) {
                        if (error) {
                            console.log('Leech Item Error. Add item to leech items queue list again: ' + itemGUID);
                            item.status = LEECH_FILE_STATUS.NOT_SUBMITTED;
                            store.set(itemGUID, item);
                            leecherItemsQueueList.unshift(itemGUID);
                        } else {
                            item.status = LEECH_FILE_STATUS.SUBMIT_SUCCESS;
                        }
                        store.set(itemGUID, item);
                        removeItemFromLeechItemsQueueList(itemGUID);
                        const time = Math.floor(Math.random() * 10000 / 4) + 3000;
                        setTimeout(function () {
                            startLeechQueueSubmit();
                        }, time);
                        renderManageLeechItemsListTable();
                    });
                }
            } else {
                isSubmittingLeecherQueue = false;
            }
        }

        /**
         * Submit item to Leech.
         */
        function submitItemToLeecher(itemUrl, itemFolderId, callback) {
            console.log('Submitting item to leecher: ' + itemUrl + ' ' + itemFolderId);
            const leechHub = new SocketEngine("ws://namava.ir:8090", true);
            const myClientId = leechHub.connectionId;

            getLeecherServerStatus(leecherServerId).done(function (data) {
                if (data !== null) {
                    console.log('Currently leeching item.');
                    callback('error');
                } else {
                    $.ajax({
                        type: "POST",
                        contentType: "application/json",
                        xhrFields: {
                            withCredentials: true
                        },
                        url: shatellandLeecherServers[leecherServerId].address,
                        data: JSON.stringify({
                            Url: itemUrl,
                            ConnectionId: myClientId,
                            FolderId: itemFolderId
                        })
                    }).success(function (data) {
                        console.log('Success', data);
                        //leechModalManager();
                        handleCurrentLeecherServersFileStatus(leecherServerId);
                        callback();
                    }).fail(function (ex, message, mmmm, koft) {
                        callback('error');
                    });
                }
            }).fail(function () {
                callback('error');
            });
        }

        /*
        function leechModalManager() {
            const mainControllerScope = $('#sh-upload-center').scope();
            const injector = $('body').injector(), FileSystem = injector.get('UploadCenter.Service.FileSystem');
            
            mainControllerScope.$apply(function () {
 
                mainControllerScope.currentLeech = null;
                mainControllerScope.showSuccessLeechMessage = false;
                let repeat = function () {
                    FileSystem.leechManager(function (data) {
                        $('.leech-modal').modal('hide');
                        const actionsControllerScope = $('.actions-modal').scope();
                        actionsControllerScope.$apply(function () {
                            actionsControllerScope.actions.leech.url = '';
                        });
                        if (data.Info) {
                            data.Info.Percentage = Math.round(data.Info.Percentage * 100) / 100;
                            mainControllerScope.currentLeech = data;
                            mainControllerScope.showSuccessLeechMessage = false;
                        } else {
                            clearInterval(repeatInerval);
                            
                            mainControllerScope.showSuccessLeechMessage = true;
                            setTimeout(function () {
                                mainControllerScope.$apply(function () {
                                    mainControllerScope.currentLeech = null;
                                    mainControllerScope.showSuccessLeechMessage = null;
                                });
                            }, 5000);
                        }
                    });
                };
                repeat();
                let repeatInerval = setInterval(repeat, 1000);
            });
        }
        */

        /**
         * Handle direct download selected items.
         */
        function handleDirectDownloadSelectedItems() {
            const currentFolderId = getCurrentFolderId();

            const selectedFilesAndFolders = getSelectedFilesAndFolders();

            console.log('Selected Files: ' + selectedFilesAndFolders.files);
            console.log('Selected Folders: ' + selectedFilesAndFolders.folders);

            if (selectedFilesAndFolders.files.length > 0) {
                getFolderArchiveContext(currentFolderId, function (folderArchiveContext) {
                    console.log('Direct downloading of selected files in folder: ' + folderArchiveContext);
                    for (let fileIndex in selectedFilesAndFolders.files) {
                        const fileDownloadPageUrl = getFileDownloadPageUrl(selectedFilesAndFolders.files[fileIndex], folderArchiveContext);
                        startDirectDownloadOfFileByPageUrl(fileDownloadPageUrl);
                    }
                });
            }

            if (selectedFilesAndFolders.folders.length > 0) {
                for (let selectedFolderIndex in selectedFilesAndFolders.folders) {
                    const folderId = selectedFilesAndFolders.folders[selectedFolderIndex];
                    console.log('Direct downloading of selected folder: ' + folderId);
                    getFolderArchiveContext(folderId, function (folderArchiveContext) {
                        directDownloadFolderFiles(folderArchiveContext);
                    });

                }
            }
        }

        /**
         * Handle direct download link of selected items
         */
        function handleDirectDownloadLinkOfSelectedItems() {
            const currentFolderId = getCurrentFolderId();

            const selectedFilesAndFolders = getSelectedFilesAndFolders();

            console.log('Selected Files: ' + selectedFilesAndFolders.files);
            console.log('Selected Folders: ' + selectedFilesAndFolders.folders);

            if (selectedFilesAndFolders.files.length > 0) {
                getFolderArchiveContext(currentFolderId, function (folderArchiveContext) {
                    console.log('Direct downloading of selected files in folder: ' + folderArchiveContext);
                    for (let fileIndex in selectedFilesAndFolders.files) {
                        const fileDownloadPageUrl = getFileDownloadPageUrl(selectedFilesAndFolders.files[fileIndex], folderArchiveContext);
                        getFileDirectDownloadUrlByDownloadPageUrl(fileDownloadPageUrl, function (directUrl) {
                            directDownloadLinksList.push(directUrl);
                            renderDirectDownloadListModal();
                        });
                    }
                });
            }

            if (selectedFilesAndFolders.folders.length > 0) {
                for (let selectedFolderIndex in selectedFilesAndFolders.folders) {
                    const folderId = selectedFilesAndFolders.folders[selectedFolderIndex];
                    console.log('Direct downloading of selected folder: ' + folderId);
                    getFolderArchiveContext(folderId, function (folderArchiveContext) {
                        const folderFiles = getFolderFilesPageUrl(folderArchiveContext);
                        for (let fileIndex in folderFiles) {
                            getFileDirectDownloadUrlByDownloadPageUrl(folderFiles[fileIndex].pageUrl, function (directUrl) {
                                directDownloadLinksList.push(directUrl);
                                renderDirectDownloadListModal();
                            });
                        }

                    });

                }
            }
        }

        /**
         * Render Direct Download List Modal
         */
        function renderDirectDownloadListModal() {
            const $directDownloadListListularTBody = $('#direct_download_links_list_tbody'),
                $directDownloadListTextularText = $('#direct_download_links_list_textarea');
            $directDownloadListListularTBody.html('');
            $directDownloadListTextularText.val(directDownloadLinksList.join('\n'));
            console.log(directDownloadLinksList.join('\n'));

            for (var directDownloadLinkIndex in directDownloadLinksList) {
                $directDownloadListListularTBody.append('<tr><td style="direction: ltr;text-align: left;"><a href="' + directDownloadLinksList[directDownloadLinkIndex] + '">' + directDownloadLinksList[directDownloadLinkIndex] + '</a></td></tr>');
            }

        }

        /**
         * Get selected files and folders
         */
        function getSelectedFilesAndFolders() {
            const selectedItems = $('.fm-item.ui-selected');

            let selectedFolders = [], selectedFiles = [];
            $.each(selectedItems, function () {
                if ($(this).hasClass('file')) {
                    selectedFiles.push($(this).attr('data-id'));
                } else if ($(this).hasClass('archive-folder')) {
                    selectedFolders.push($(this).attr('data-id'));
                }
            });
            return {
                files: selectedFiles,
                folders: selectedFolders
            };
        }

        /**
         * Get folder archive context
         */
        function getFolderArchiveContext(folderId, callback) {
            console.log('Getting folder archive context: ' + folderId);
            $.get('https://' + requestUrlPrefix + 'shatelland.com/api/Archive/GetUserArchiveContext/' + folderId + '/0', function (data) {
                callback(data);
            });
        }

        /**
         * Get download page url of file.
         */
        function getFileDownloadPageUrl(fileId, folderArchiveContext) {
            console.log('Get file download page url: ' + fileId);
            let pageUrl = '';
            for (let nonAttrArchive in folderArchiveContext.NonAttrArchives) {
                if (folderArchiveContext.NonAttrArchives[nonAttrArchive].ArchiveId == fileId) {
                    const fileArchiveAttrs = folderArchiveContext.NonAttrArchives[nonAttrArchive].NonAttrArchiveFiles[0].FileArchiveAttributes;
                    let fileLink = '';
                    for (let attr_index in fileArchiveAttrs) {
                        if (fileArchiveAttrs[attr_index].Key == 'link') {
                            fileLink = fileArchiveAttrs[attr_index].Value;
                            break;
                        }
                    }
                    pageUrl = 'https://' + requestUrlPrefix + 'shatelland.com/upload' + fileLink;
                }
            }

            return pageUrl;
        }

        /**
         * Start direct download of file by its download page url.
         * @param fileDownloadPageUrl
         */
        function startDirectDownloadOfFileByPageUrl(fileDownloadPageUrl) {
            getFileDirectDownloadUrlByDownloadPageUrl(fileDownloadPageUrl, function (downloadDirectUrl) {
                console.log('Direct downloading of file: ' + downloadDirectUrl);

                if (downloadDirectUrl) {
                    const $iframe = $('<iframe class="file-direct-download-iframe" src="' + downloadDirectUrl + '"></iframe>');
                    $('body').append($iframe);
                    console.log('Direct download of file iframe added.');
                    setTimeout(function () {
                        console.log('Direct download of file iframe removed.');
                        $iframe.remove();
                    }, DIRECT_DOWNLOAD_IFRAME_DURATION);
                }
            });
        }

        /**
         * Get file direct download url by download page url
         */
        function getFileDirectDownloadUrlByDownloadPageUrl(fileDownloadPageUrl, callback) {
            $.get(fileDownloadPageUrl).success(function (data) {
                const downloadDirectUrlRegex = /id="downloadFile" href="(.*)" /i;
                const downloadDirectUrl = downloadDirectUrlRegex.exec(data)[1];

                callback(downloadDirectUrl);
            }).fail(function (jqXHR) {
                const downloadDirectUrlRegex = /id="downloadFile" href="(.*)" /i;
                const downloadDirectUrl = downloadDirectUrlRegex.exec(jqXHR.responseText)[1];

                callback(downloadDirectUrl);
            });
        }

        /**
         * Direct download of whole folder
         */
        function directDownloadFolderFiles(folderArchiveContext) {
            const files = getFolderFilesPageUrl(folderArchiveContext);
            for (var fileIndex in files) {
                startDirectDownloadOfFileByPageUrl(files[fileIndex].pageUrl);
            }
        }

        /**
         * Get folder files page url
         * @param folderArchiveContext
         * @returns {Array}
         */
        function getFolderFilesPageUrl(folderArchiveContext) {
            let files = [];
            if (folderArchiveContext.NonAttrArchives.length > 0) {
                const filesJson = folderArchiveContext.NonAttrArchives;
                for (let fileIndex in filesJson) {
                    const file = filesJson[fileIndex];
                    const fileArchiveAttrs = file.NonAttrArchiveFiles[0].FileArchiveAttributes;
                    let fileLink = '';
                    for (let attr_index in fileArchiveAttrs) {
                        if (fileArchiveAttrs[attr_index].Key == 'link') {
                            fileLink = fileArchiveAttrs[attr_index].Value;
                            break;
                        }
                    }
                    files.push({ pageUrl: 'https://' + requestUrlPrefix + 'shatelland.com/upload' + fileLink });
                }
            }
            return files;
        }

        /**
         * Handle Refresh Used Space
         */
        function handleRefreshUsedSpace() {
            console.log('Refresh Used Space');
            const injector = $('body').injector(), $timeout = injector.get('$timeout');

            var scope = $('.progressLimit').scope();
            scope.reloadUserAccountInfo();

            $timeout(function () {
                scope.$apply(function () {
                });
            }, 0);
        }

        /**
         * Handle refresh file manager
         */
        function handleRefreshFileManager() {
            const currentFolderId = getCurrentFolderId(), injector = $('body').injector(),
                FileSystemRegistry = injector.get('UploadCenter.Service.FileSystemRegistry'),
                $timeout = injector.get('$timeout');

            let index = FileSystemRegistry.fetchedFolders.indexOf(currentFolderId);
            if (index > -1) {
                FileSystemRegistry.fetchedFolders.splice(index, 1);
            }

            if (FileSystemRegistry._reg_data.hasOwnProperty(currentFolderId)) {
                delete FileSystemRegistry._reg_data[currentFolderId];
            }

            FileSystemRegistry.setData(currentFolderId, function () {
                var scope = $('.file-manager-header').next().scope();
                $timeout(function () {
                    scope.$apply(function () {
                        scope.nav.go(parseInt(currentFolderId));
                    });
                }, 0);
            });

        }

        /**
         * Handle share folder direct download of all files.
         */
        function handleShareFolderDirectDownloadOfAllFiles() {
            const $files = $('.the-file ul li');

            $.each($files, function () {
                if (requestUrlPrefix == 'www.') {
                    startDirectDownloadOfFileByPageUrl($(this).find('a').attr('href'));
                } else {
                    startDirectDownloadOfFileByPageUrl($(this).find('a').attr('href').replace('www.', ''));
                }

            });
        }

        /**
         * Handle share folder direct download of all files as link.
         */
        function handleShareFolderDirectDownloadLinkOfAllFiles() {
            const $files = $('.the-file ul li');
            $.each($files, function () {
                let downloadPageUrl = $(this).find('a').attr('href');
                if (requestUrlPrefix !== 'www.') {
                    downloadPageUrl = downloadPageUrl.replace('www.', '');
                }
                getFileDirectDownloadUrlByDownloadPageUrl(downloadPageUrl, function (directLink) {
                    directDownloadLinksList.push(directLink);
                    renderDirectDownloadListModal();
                });
            });
        }

        /**
         * Handle share folder direct download of all files as link.
         */
        function handleShareFolderDirectDownloadOfItem(url) {
            if (requestUrlPrefix == 'www.') {
                startDirectDownloadOfFileByPageUrl(url);
            } else {
                startDirectDownloadOfFileByPageUrl(url.replace('www.', ''));
            }
        }

        /**
         * Handle Instagram Leech.
         */
        function handleInstagramLeech() {
            console.log('Handle Instagram Leech');
            const $instagramLeecherInput = $('#instagram_leecher_input');
            const $instagramLeecherStatus = $('#instagram_leecher_status');
            const $doInstagramLeechButton = $('#do_instagram_leech');

            const share_url = $instagramLeecherInput.val();
            console.log('Instagram Share URL: ' + share_url);
            if (share_url) {
                $instagramLeecherStatus.html('<div style="padding: 10px; text-align: center"><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate" style="font-size: 40px; color: #4CAF50;"></span></div>');
                console.log('Instagram Share URL is OK.');
                console.log('Getting Instagram Post By cors.io: ' + share_url);
                $.ajax({
                    url: 'https://crossorigin.me/' + share_url,
                    type: 'GET',
                    xhrFields: {
                        withCredentials: false
                    },
                    success: function (response) {
                        console.log('Success Getting Instagram Post By cors.io');
                        const instagramVideoUrlRegex = /<meta property="og:video" content="(.*)" /i;
                        const instagramVideoUrl = instagramVideoUrlRegex.exec(response);
                        if (instagramVideoUrl) {
                            console.log('Video Found in instagram post: ' + instagramVideoUrl[1]);
                            const currentFolderId = getCurrentFolderId();
                            submitItemToLeecher(instagramVideoUrl[1], currentFolderId, function (error) {
                                if (error) {
                                    console.log('Submitting Instagram video to leech server error');
                                    $instagramLeecherStatus.html('<div id="chosen_idm_export_as_text_to_leech_file_name" class="bg-danger">خطا در ارسال برای ریموت.</div>');
                                    $doInstagramLeechButton.prop("disabled", false);
                                } else {
                                    console.log('Submitting Instagram video to leech server Success');
                                    $instagramLeecherStatus.html('<div id="chosen_idm_export_as_text_to_leech_file_name" class="bg-success">با موفقیت برای ریموت ارسال شد.</div>');
                                    $doInstagramLeechButton.prop("disabled", false);
                                }
                            });
                        } else {
                            console.log('No Video URL found in instagram post');
                            $instagramLeecherStatus.html('<div id="chosen_idm_export_as_text_to_leech_file_name" class="bg-danger">خطا در دریافت فایل ویدیو.</div>');
                            $doInstagramLeechButton.prop("disabled", false);
                        }
                    },
                    error: function () {
                        console.log('Error in cors.io');
                        console.log('Getting Instagram Post By crossorigin.me: ' + share_url);
                        $.ajax({
                            url: 'https://crossorigin.me/' + share_url,
                            type: 'GET',
                            xhrFields: {
                                withCredentials: false
                            },
                            success: function (response) {
                                console.log('Success Getting Instagram Post By crossorigin.me');
                                const instagramVideoUrlRegex = /<meta property="og:video" content="(.*)" /i;
                                const instagramVideoUrl = instagramVideoUrlRegex.exec(response);
                                if (instagramVideoUrl) {
                                    console.log('Video Found in instagram post: ' + instagramVideoUrl[1]);
                                    const currentFolderId = getCurrentFolderId();
                                    submitItemToLeecher(instagramVideoUrl[1], currentFolderId, function (error) {
                                        if (error) {
                                            console.log('Submitting Instagram video to leech server error');
                                            $instagramLeecherStatus.html('<div id="chosen_idm_export_as_text_to_leech_file_name" class="bg-danger">خطا در ارسال برای ریموت.</div>');
                                            $doInstagramLeechButton.prop("disabled", false);
                                        } else {
                                            console.log('Submitting Instagram video to leech server Success');
                                            $instagramLeecherStatus.html('<div id="chosen_idm_export_as_text_to_leech_file_name" class="bg-success">با موفقیت برای ریموت ارسال شد.</div>');
                                            $doInstagramLeechButton.prop("disabled", false);
                                        }
                                    });
                                } else {
                                    console.log('No Video URL found in instagram post');
                                    $instagramLeecherStatus.html('<div id="chosen_idm_export_as_text_to_leech_file_name" class="bg-danger">خطا در دریافت فایل ویدیو.</div>');
                                    $doInstagramLeechButton.prop("disabled", false);
                                }
                            },
                            error: function () {
                                console.log('Error in crossorigin.me');
                                $instagramLeecherStatus.html('<div id="chosen_idm_export_as_text_to_leech_file_name" class="bg-danger">خطا در دریافت صفحه.</div>');
                                $doInstagramLeechButton.prop("disabled", false);
                            }
                        });
                    }
                });
            } else {
                $instagramLeecherStatus.html('<div id="chosen_idm_export_as_text_to_leech_file_name" class="bg-danger">هیچ آدرسی وارد نشده است.</div>');
                $doInstagramLeechButton.prop("disabled", false);
            }
        }

        /**
         * Check shatelland leecher servers status.
         */
        let count = 0;

        function checkServerStatuses(callback) {
            for (let serverId in shatellandLeecherServers) {
                checkServerById(serverId, callback);
            }
            renderLeecherServersSelectAndStatus();
        }

        function checkServerById(serverId, callback) {
            $.ajax({
                type: "GET",
                contentType: "application/json",
                xhrFields: {
                    withCredentials: true
                },
                url: shatellandLeecherServers[serverId].address,
                error: function (xhr) {
                    count++;
                    if (xhr.status == 405) {
                        shatellandLeecherServers[serverId].status = 1;
                    } else {
                        shatellandLeecherServers[serverId].status = 0;
                    }

                    renderLeecherServersSelectAndStatus();
                    if (count == Object.keys(shatellandLeecherServers).length) {
                        if (callback) {
                            callback();
                        }
                    }
                }
            });
        }

        /**
         * Render Server status and select
         */
        function renderLeecherServersSelectAndStatus() {
            const $leecherServersSelectWrapper = $('#leecher_servers_select_wrapper');
            let html = ``;
            html += `<span class="btn btn-default refresh-server-statuses"><i class="glyphicon glyphicon-refresh"></i></span>`;
            for (let serverId in shatellandLeecherServers) {
                html += `
                    <span class="btn btn-default leecher-server-button server-${serverId} ${shatellandLeecherServers[serverId].status ? 'btn-success' : 'btn-danger'}${(serverId == leecherServerId) ? ' active' : ''}" style="direction: rtl" data-id="${serverId}">
                        ${shatellandLeecherServers[serverId].text}
                        ${(serverId == leecherServerId) ? ' <i class="glyphicon glyphicon-ok"></i>' : ''}
                    </span>
                `;
            }

            $leecherServersSelectWrapper.html(html);
        }

        /**
         * Change server button click.
         * @param serverId
         */
        function handleLeecherServerSelect(serverId) {
            if (leecherServerId != serverId) {
                store.set(LEECHER_SERVER_ID_KEY, serverId);
                leecherServerId = serverId;
                console.log('Leecher Server Changed to: ' + serverId);
                renderLeecherServersSelectAndStatus();
            }
        }

        /**
         * Render current leecher server status that are bottom of page
         */
        function renderCurrentLeecherServerFilesManager() {
            console.log('Render current leecher server files manager for first time.');
            $body.append(currentLeecherServerFilesManagerHtml);

            for (const server_id in shatellandLeecherServers) {
                $('#current_leecher_server_files_manager').append(`
                    <div class="leecher-server no-file" id="leecher_server_file_${server_id}">
                        <div class="server-id">${server_id.toUpperCase()}</div>
                        <div class="no-file-status">هیچ فایلی در حال ریموت نمی باشد.</div>
                        <div class="current-file-data">
                            <div id="server_${server_id}_file_address" class="file-address" data-toggle="tooltip"
                            title="آدرس فایل"><input
                            class="file-address-input" type="text" value="" /></div>
                            <div class="circle-progress" data-toggle="tooltip" title="درصد انتقال"><span></span></div>
                        </div>
                        <div class="animated-button">
                            <div class="cancle-button" data-toggle="tooltip" title="لفو انتقال" data-id="${server_id}"><span
                            class="glyphicon glyphicon-remove"></span></div>
                            <div class="copy-button" data-toggle="tooltip" title="کپی آدرس" data-clipboard-target="#server_${server_id}_file_address"><span class="glyphicon glyphicon-copy"></span></div>
                        </div>
                    </div>
                `);
                $('#leecher_server_file_' + server_id + ' .circle-progress').circleProgress({
                    value: 0,
                    size: 30,
                    emptyFill: "rgba(0, 0, 0, .1)",
                    fill: '#31b0d5'
                }).on('circle-animation-progress', function (event, progress, stepValue) {
                    $(this).find('span').text(Math.round(stepValue.toFixed(2).substr(1) * 100));
                });
            }
            $('[data-toggle="tooltip"]').tooltip();
            handleCurrentLeecherServersFileStatus();
        }

        /**
         * Handle current leecher servers file status
         * @param server_id
         */
        function handleCurrentLeecherServersFileStatus(server_id) {
            console.log('Render current leecher servers file status.')
            if (server_id) {
                if (!shatellandLeecherServers[server_id].interval) {
                    handleCurrentLeecherServerFileStatus(server_id);
                }
            } else {
                for (const server_id in shatellandLeecherServers) {
                    if (!shatellandLeecherServers[server_id].interval) {
                        handleCurrentLeecherServerFileStatus(server_id);
                    }
                }
            }
        }

        /**
         * Handle current leecher server file status
         * @param server_id
         */
        function handleCurrentLeecherServerFileStatus(server_id) {
            getLeecherServerStatus(server_id).done(function (data) {
                if (data !== null) {
                    if (!shatellandLeecherServers[server_id].interval) {
                        shatellandLeecherServers[server_id].interval = setInterval(function () {
                            handleCurrentLeecherServerFileStatus(server_id);
                        }, 1000);
                    }
                } else {
                    if (shatellandLeecherServers[server_id].interval) {
                        console.log('Clearing interval ' + server_id);
                        clearInterval(shatellandLeecherServers[server_id].interval);
                        shatellandLeecherServers[server_id].interval = 0;
                    }
                }
                renderCurrentLeecherServerFileStatus(server_id, data)
            }).fail(function () {
                console.log('Getting leech server file status error');
            });
        }

        /**
         * Render current leecher server file status
         * @param server_id
         * @param data
         */
        function renderCurrentLeecherServerFileStatus(server_id, data) {
            console.log('Render current leecher server ' + server_id + ' file status.')
            if (data !== null) {
                $('#leecher_server_file_' + server_id).removeClass('no-file');
                $('#leecher_server_file_' + server_id).find('.file-address-input').attr('value', data.Info.Url);
                if (data.Info.Percentage > 0) {
                    data.Info.Percentage /= 100;
                } else {
                    data.Info.Percentage = 0;
                }
                $('#leecher_server_file_' + server_id).find('.circle-progress').circleProgress('value', data.Info.Percentage);
            } else {
                $('#leecher_server_file_' + server_id).addClass('no-file');
                $('#leecher_server_file_' + server_id).find('.file-address-input').attr('value', '');
                $('#leecher_server_file_' + server_id).find('.circle-progress').circleProgress('value', 0);
            }
        }

        /**
         * Get leecher server status by id
         * @param server_id
         * @returns {Promise}
         */
        function getLeecherServerStatus(server_id) {
            return $.get(shatellandLeecherServers[server_id].currentUserAddress);
        }
    };

    /**
     * Inject main script to page.
     *
     * We inject a script tag contains our functionality (ShatellandAdvancedFeaturesMain function) to main page instead of
     * writing it straight as a userscript to fix an issue with greasemonky sandboxing in firefox.
     * This sanbox wont allow us to use scripts/libs that included in the main page.
     */
    console.log('Adding ShatellandAdvancedFeaturesMain as script to page');
    let mainScript = document.createElement('script');
    mainScript.type = "text/javascript";
    mainScript.textContent = '(' + ShatellandAdvancedFeaturesMain.toString() + ')();';
    document.body.appendChild(mainScript);

})();
