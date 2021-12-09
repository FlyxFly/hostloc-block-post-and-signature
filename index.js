// ==UserScript==
// @name         Hostloc根据关键字和用户名屏蔽帖子
// @namespace    https://hostloc.com/
// @version      0.2
// @description  根据关键字和用户名屏蔽帖子
// @author       kiwi
// @match        https://hostloc.com/forum-*
// @match        https://hostloc.com/thread-*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const blockedUser=['CMBCHINA','等1下™我老公呢','朕的大清完了？','optimism','朕射你无罪','svd1983','Erik'];
    const blockedKeyword=['良心云','腾讯云','轻量','清凉','loudcone','绿云','webhorizon','pacificrack','斯巴达'];
    const blockedSignatureUser=['louiejordan','燕十三丶','快上车'];
    const contentStorage=[];//用于临时存储被屏蔽的帖子和签名内容

    // 帖子列表页
    if(location.href.includes('forum')){
        document.querySelectorAll('#threadlisttableid tbody').forEach((item,index)=>{
            if(item.id.includes('normalthread')){
                const title=item.querySelector('a.s.xst').innerText;
                for (let i = blockedKeyword.length - 1; i >= 0; i--) {
                    if(title.includes(blockedKeyword[i])){
                        // item.querySelector('a.s.xst').innerText='已屏蔽';
                        item.style.display='none';
                        break;
                    }
                }


                const nameA=item.querySelectorAll('td.by')[0].querySelector('a');
                if(nameA){
                    const userName=nameA.innerText.trim();
                    if(blockedUser.includes(userName)){
                        // item.querySelector('a.s.xst').innerText='已屏蔽';
                        item.style.display='none';
                    }
                }
            }
        })
    }

    // 帖子内容页
    if(location.href.includes('thread')){
        //监听点击事件，恢复被屏蔽的签名和帖子
        document.querySelector('#postlist').addEventListener('click',(e)=>{
            const item=e.target;
            if(item.className.includes('hidden-by-script')){
                item.innerHTML=contentStorage[item.dataset.restoreKey]
            }
        })
        //遍历发帖和回复
        document.querySelectorAll('#postlist>div').forEach((item)=>{
            if(!item.id.includes('post_')){
                return false;
            }
            const userLink=item.querySelector('a.xw1');
            if(userLink){
                const userName=userLink.innerText.trim();
                if(userName && blockedUser.includes(userName)){
                    item.style.display='none';
                }else if(blockedSignatureUser.includes(userName)){
                    const signature=item.querySelector('div.sign');
                    const contentText=signature.innerText;
                    const contentHTML=signature.innerHTML;
                    const storageKey=item.id+'signature';
                    contentStorage[storageKey]=contentHTML;
                    signature.innerHTML=`<span style="font-style:italic;font-size:10px;color:gray" class="hidden-by-script" data-restore-key="${storageKey}" title="${contentText}">已屏蔽,鼠标移到此处查看内容,点击还原内容</span>`;
                }
            }

            const tds=item.querySelectorAll('td');
            tds.forEach((td)=>{
                if(td.id.includes('postmessage_')){
                    const content=td.innerText;
                    for (let i = blockedKeyword.length - 1; i >= 0; i--) {
                        if(content.includes(blockedKeyword[i])){
                            const contentHTML=td.innerHTML;
                            const contentText=td.innerText;
                            contentStorage[item.id]=contentHTML;
                            td.innerHTML=`<span style="font-style:italic;font-size:10px;color:gray" class="hidden-by-script" data-restore-key="${item.id}" title="${content}">已屏蔽，鼠标移到此处查看内容</span>`;
                            break;
                        }

                    }
                }
            })
        })
    }
})();