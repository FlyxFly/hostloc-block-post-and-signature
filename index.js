    // ==UserScript==
    // @name         Hostloc根据关键字和用户名屏蔽帖子
    // @namespace    https://hostloc.com/
    // @version      0.2.3
    // @description  根据关键字和用户名屏蔽帖子，根据用户名屏蔽签名
    // @author       kiwi
    // @homepage     https://github.com/FlyxFly/hostloc-block-post-and-signature
    // @match        https://hostloc.com/forum-*
    // @match        https://hostloc.com/thread-*
    // @match        https://hostloc.com/forum.php?mod=viewthread&tid=*
    // @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
    // ==/UserScript==

    (function() {
        'use strict';

        const now = function(){
            return new　Date().getTime();
        }


        // 移除数组中的空元素
        if(!Array.prototype.trim){
            Array.prototype.trim = function removeEmptyElements () {
                return this.filter((x)=>{
                    return x;
                })
            }
        }


        // 查询数组是否存在某个值，忽略大小写
        if(!Array.prototype.contains){
            Array.prototype.contains = function checkIfInArray (target) {
                for(let i=0;i<this.length;i++){
                    if(this[i].toUpperCase().includes(target.toUpperCase())){
                        return true;
                    }
                }
                return false
            }
        }


        /**
         * @param {String} HTML representing a single element
         * @return {Element}
         */
        const htmlToElement = function (html) {
            const template = document.createElement('template');
            html = html.trim(); // Never return a text node of whitespace as the result
            template.innerHTML = html;
            return template.content.firstChild;
        }



        class HostLocBlocker{

            constructor(){
                this.config={
                    blockedUser:[],
                    blockedKeyword:[],
                    blockedSignatureUser:[],
                    pantry:{
                        APIKey:null,
                        basket:null
                    }
                }
                this.dataKeys = ['blockedUser','blockedKeyword','blockedSignatureUser'];
                this.contentStorage=[];
                this.localStorageKey = 'hostlocBlockPlugin';
            }

            saveToLocal(){
                const toBeStored = {
                    timestamp: now(),
                    data:this.config
                }
                
                localStorage.setItem(this.localStorageKey,JSON.stringify(toBeStored));
            }

            /**
             * 从localstorage读取数据并加载到this.config
             * 
             * @param undefined 参数1的说明
             * @return undefined 返回值描述
            **/
            restoreFromLocal(){
                const data=localStorage.getItem(this.localStorageKey);
                if(data){
                    const jsonData=JSON.parse(data);
                    if(jsonData.data.pantry.APIKey && jsonData.data.pantry.basket){
                        this.config.pantry = jsonData.data.pantry;
                        if((now() - jsonData.timestamp) > 12*3600*1000){
                            return this.modifyCloudData('get');
                        } 
                    }
                    
                    for (let x in this.dataKeys) {
                        const key = this.dataKeys[x];
                        this.config[key]=jsonData.data[key];
                    }
                } 
            }

            async modifyCloudData(action){
                if(!this.config.pantry.APIKey || !this.config.pantry.basket){
                    return false;
                }
                const url = `https://getpantry.cloud/apiv1/pantry/${this.config.pantry.APIKey}/basket/${this.config.pantry.basket}`;
                switch(action){
                    case 'get':
                        fetch(url,{
                            method:'GET',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                        })
                        .then((response)=>response.json())
                        .then((data)=>{
                            this.config = data;
                            this.saveToLocal();
                            this.restoreFromLocal();
                            this.startBlockProcess();
                            console.log('Got data from cloud.',data);
                        })
                        
                        break;

                    case 'save':
                        fetch(url, {
                            method:'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body:JSON.stringify(this.config)
                        }).then((res)=>{
                            console.log('Save data to cloud',res);
                        })
                        break;

                    default:
                        return false;
                }
            }


            hideFromList(){
                const blockedKeyword = this.config.blockedKeyword;
                const blockedUser = this.config.blockedUser;
                document.querySelectorAll('#threadlisttableid tbody').forEach((item,index)=>{
                    if(item.id.includes('normalthread')){
                        const title=item.querySelector('a.s.xst').innerText;
                        for (let i = blockedKeyword.length - 1; i >= 0; i--) {
                            if(title.toUpperCase().includes(blockedKeyword[i].toUpperCase())){
                                // item.querySelector('a.s.xst').innerText='已屏蔽';
                                item.style.display='none';
                                break;
                            }
                        }


                        const nameA=item.querySelectorAll('td.by')[0].querySelector('a');
                        if(nameA){
                            const userName=nameA.innerText.trim().toUpperCase();
                            if(blockedUser.contains(userName)){
                                // item.querySelector('a.s.xst').innerText='已屏蔽';
                                item.style.display='none';
                            }
                        }
                    }
                })

            }


            hideReplyAndSignature(){
                const blockedSignatureUser = this.config.blockedSignatureUser;
                const blockedKeyword = this.config.blockedKeyword;
                const contentStorage = this.contentStorage;
                const blockedUser = this.config.blockedUser;
                document.querySelectorAll('#postlist>div').forEach((post)=>{
                    if(!post.id.includes('post_')){
                        return false;
                    }
                    const userLink=post.querySelector('a.xw1');
                    if(userLink){
                        const userName=userLink.innerText.trim();
                        // 根据用户名屏蔽发帖
                        if(userName && blockedUser.includes(userName)){
                            post.style.display='none';
                            return false;
                        }

                        // 根据用户名屏蔽签名
                        if(blockedSignatureUser.includes(userName) && post.querySelector('div.sign')){
                            const signature=post.querySelector('div.sign');
                            const contentText=signature.innerText;
                            const contentHTML=signature.innerHTML;
                            const storageKey=post.id+'signature';
                            contentStorage[storageKey]=contentHTML;
                            signature.innerHTML=`<span style="font-style:italic;font-size:10px;color:gray" class="hidden-by-script" data-restore-key="${storageKey}" title="${contentText}">已屏蔽,鼠标移到此处查看内容,点击还原内容</span>`;
                        }
                    }

                    const tds=post.querySelectorAll('td');
                    tds.forEach((td)=>{
                        // 查找帖子内容容器: td.postmessage_{thread_id}
                        if(td.id.includes('postmessage_')){
                            const content=td.innerText;
                            for (let i = blockedKeyword.length - 1; i >= 0; i--) {
                                // 根据关键字屏蔽发帖内容
                                if(content.toUpperCase().includes(blockedKeyword[i].toUpperCase())){
                                    const contentHTML=td.innerHTML;
                                    const contentText=td.innerText;
                                    contentStorage[post.id]=contentHTML;
                                    td.innerHTML=`<span style="font-style:italic;font-size:10px;color:gray" class="hidden-by-script" data-restore-key="${post.id}" title="${content}">已屏蔽，鼠标移到此处查看内容,点击还原内容</span>`;
                                    break;
                                }

                            }
                        }
                    })
                })
            }

            addSettingButton(){
    
                const p =  document.querySelectorAll('#um p')[1];
                p.appendChild(htmlToElement(`<span class="pipe">|</span>`));
                p.appendChild(htmlToElement(`<a class="showmenu" id="show-block-panel">屏蔽名单设置</a>`));
            
            }


            addSettingPanel(){
                const div = document.createElement('div');
                div.id='hostloc-blocker-panel-wrapper';
                div.innerHTML = `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Document</title>
                </head>
                <body>
                    <div id="hostloc-blocker-panel" class="modal">
                        <div class="modal-title">
                            <p>Hostloc 屏蔽插件设置面板</p>
                        </div>
                        <div class="modal-content">
                            <div class="column api-setting">
                                <div class="field">
                                    <label for="">Pantry API Key</label>
                                    <input type="text" placeholder="没有可不填" name="pantry-api-key">
                                </div>
                
                                <div class="field">
                                    <label for="">Pantry Basket</label>
                                    <input type="text" placeholder="没有可不填" name="pantry-basket-name">
                                </div>
                                <p class="help">如填写Pantry API参数，可同时保存到云端。不填则仅保存到本地。<a href="https://getpantry.cloud/" target="_blank">点此注册</a></p>
                                <p class="help">如只填Pantry API参数，则从云端获取配置。</p>
                            </div>
                            <div class="columns">
                                <div class="column">
                                    <label>屏蔽发帖</label>
                                    <p class="help">每行一个<strong>区分大小写</strong></p>
                                    <textarea name="blocked-user" id="blocked-user" cols="15" rows="13"></textarea>
                                </div>
                                <div class="column">
                                    <label>屏蔽签名</label>
                                    <p class="help">每行一个,<strong>区分大小写</strong></p>
                                    <textarea name="blocked-signature-user" id="blocked-signature-user" cols="15" rows="13"></textarea>
                                </div>
                                <div class="column">
                                    <label>屏蔽关键字</label>
                                    <p class="help">每行一个，<strong>不分大小写</strong></p>
                                    <textarea name="blocked-keyword" id="blocked-keyword" cols="15" rows="13"></textarea>
                                </div>
                            </div>
                        </div>
                    
                        <div class="modal-footer">
                        <button class="save">保存并关闭</button>
                        <p class="help">保存后刷新页面生效</p>
                        </div>
                    </div>
                
                    <style>
            
                        #hostloc-blocker-panel{
                            display: none;
                            background-color: white;
                            position: fixed;
                            left: 50%;
                            top: 100px;
                            transform: translateX(-50%);
                            padding: 20px;
                            width: 500px;
                            border-radius: 10px;
                            font-family:"Microsoft Yahei",Georgia, 'Times New Roman', Times, serif;
                            box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
                        }

                        #hostloc-blocker-panel.is-active{
                            display: block
                        }
                
                        #hostloc-blocker-panel .modal-content p{
                            margin-bottom: 0;
                        }
                
                        #hostloc-blocker-panel ::-webkit-scrollbar {
                            width: 10px;
                        }
                
                        #hostloc-blocker-panel .columns{
                            margin-top: 10px;
                            display: flex;
                            justify-content: space-evenly;
                        }
                
                        #hostloc-blocker-panel label{
                            font-weight: 700;
                            font-size: 15px;
                        }
                
                        #hostloc-blocker-panel .modal-title{
                            text-align: center;
                            border-bottom: 1px solid rgb(238, 238, 238);
                        }
                
                        #hostloc-blocker-panel .modal-content {
                            padding-bottom: 20px;
                            border-bottom: 1px solid rgb(238, 238, 238);
                        }
                        #hostloc-blocker-panel .modal-content .help{
                            color: rgb(43, 43, 43);
                            font-size: 11px;
                            margin-top: 0;
                        }
                        #hostloc-blocker-panel .modal-content .api-setting{
                            margin-top: 20px;
                        }
                        #hostloc-blocker-panel .modal-content .api-setting .field{
                            display: flex;
                            width: 100%;
                            position: relative;
                            height: 40px;
                            align-items: center;
                        }
                
                        #hostloc-blocker-panel .modal-content .api-setting label{
                            line-height: 40px;
                            display: block;
                            width: 30%;
                            height: 100%;
                        }
                
                        #hostloc-blocker-panel .modal-content .api-setting input{
                            height: 25px;
                            display: block;
                            width: 70%;
                
                        }
                
                        #hostloc-blocker-panel .modal-content .api-setting::after{
                            clear: both;
                        }
                
                        #hostloc-blocker-panel .modal-content textarea, 
                        #hostloc-blocker-panel .modal-content input{
                            border:1px solid #ddd;
                            border-radius: 5px;
                            color: #363636;
                            
                            border-color: 1px solid #b5b5b5;
                            font-size: 15px;
                        
                        }
                        #hostloc-blocker-panel textarea:hover, 
                        #hostloc-blocker-panel input:hover{
                            border-color: #b5b5b5;
                        }
                        #hostloc-blocker-panel textarea:focus, 
                        #hostloc-blocker-panel input:focus{
                            outline:none
                        }
                
                        #hostloc-blocker-panel .modal-footer{
                            padding:30px 30px 0;
                            text-align: right;
                        }
                
                        #hostloc-blocker-panel .modal-footer button{
                            padding: 5px 15px;
                            border-color: #235994;
                            background-color: #06C;
                            background-position: 0 -48px;
                            color: #FFF;
                
                        }
                    </style>
                </body>
                </html>`;
            document.body.appendChild(div);

            }

            addPanelEvents(){
                const panel = document.querySelector('#hostloc-blocker-panel');
                const saveButton = panel.querySelector('.save');
                const inputPantryAPIKey = panel.querySelector('[name="pantry-api-key"]');
                const inputBasketName = panel.querySelector('[name="pantry-basket-name"]');
                const textareaBlockedUser = panel.querySelector('textarea[name="blocked-user"]');
                const textareaBlockedSignatureUser = panel.querySelector('textarea[name="blocked-signature-user"]');
                const textareaBlockedKeyword = panel.querySelector('textarea[name="blocked-keyword"]');
                const openPanelLink = document.querySelector('#show-block-panel');

                panel.addEventListener('click',(event)=>{
                    event.stopPropagation();
                })

                document.body.addEventListener('click',()=>{
                    panel.classList.remove('is-active');
                })

                openPanelLink.addEventListener('click',(event)=>{
                    event.stopPropagation();
                    textareaBlockedKeyword.value = this.config.blockedKeyword.join('\n');
                    textareaBlockedSignatureUser.value = this.config.blockedSignatureUser.join('\n');
                    textareaBlockedUser.value = this.config.blockedUser.join('\n');
                    inputPantryAPIKey.value = this.config.pantry.APIKey;
                    inputBasketName.value = this.config.pantry.basket;
                    panel.classList.add('is-active');

                });

                saveButton.addEventListener('click',()=>{
                    this.config.pantry.APIKey = inputPantryAPIKey.value;
                    this.config.pantry.basket = inputBasketName.value;
                    
                    // 如果仅输入了apikey 则表示从云端拉取数据，将覆盖本地数据
                    if(!textareaBlockedKeyword.value && !textareaBlockedSignatureUser.value && !textareaBlockedUser.value){
                        this.modifyCloudData('get');
                        return;
                    }else{
                        // 将api key 和数据保存到本地
                        this.config.blockedKeyword = textareaBlockedKeyword.value.split('\n').trim();
                        this.config.blockedSignatureUser = textareaBlockedSignatureUser.value.split('\n').trim();
                        this.config.blockedUser = textareaBlockedUser.value.split('\n').trim();

                        
                        // 保存到本地
                        this.saveToLocal();
                        // 将数据保存到云端
                        this.modifyCloudData('save');

                    }
                    panel.classList.remove('is-active');
                })
            }




            startBlockProcess(){
                if(location.href.includes('forum')){
                    this.hideFromList();
                }

                if(location.href.includes('thread')){
                    this.hideReplyAndSignature();
                }

                //监听点击事件，恢复被屏蔽的签名和帖子
                if(location.href.includes('thread')){
                    document.querySelector('#postlist').addEventListener('click',(e)=>{
                        const item=e.target;
                        if(item.className.includes('hidden-by-script')){
                            item.innerHTML=this.contentStorage[item.dataset.restoreKey];
                            item.title='';
                            item.style='';
                        }
                        
                    })
                }
            }

            init(){
                this.addSettingPanel();
                this.addSettingButton();
                this.addPanelEvents();
                this.restoreFromLocal();
            
                this.startBlockProcess();
                
            }


        }

        const app=new HostLocBlocker();
        app.init();
    
    })();