(function(F){F.loader.impl(function(){return["ext.gadget.store.MassCopyUpload@22d2e95c",function(A,Q,V,Y){(function(i){const W=(window.MassCopyUpload||{}).TIME_INTERVAL_PER_UPLOAD_IN_MILLISECONDS||1e3,P=(window.MassCopyUpload||{}).MAX_NUMBER_OF_UPLOAD_REQUESTS||4,k=(window.MassCopyUpload||{}).MAX_FILE_UPLOADS_PER_BATCH_OPERATION||500,T=(window.MassCopyUpload||{}).SPECIAL_PAGE_TITLE||"Special:BlankPage/MassCopyUploadImages",E={"ui--document-webpage-title":"Mass Copy Upload Images - $1","ui--document-title":"Mass Copy Upload Images","ui--overview-explanation":'This is a tool used for transferring images from one wiki to another by copy-uploading the files through URL in batches. To use this tool, <code><nowiki>$</nowiki>wgAllowCopyUploads</code> must be set to true on LocalSettings.php, and the user right <code>upload_by_url</code> must be granted to the user. For more information, refer to the page [[mw:Manual:Configuring_file_uploads/en#Uploading_directly_from_a_URL_("sideloading")|Configuring file uploads]] on the official MediaWiki documentation.',"ui--overview-batch-size-limit-message":"A maximum of $1 files may be uploaded per mass operation.","ui--load-image-metadata-list-confirmation":"This will load the image metadata for the listed files. Continue?","ui--clear-image-metadata-list-confirmation":"Are you sure you want to clear the list of image metadata currently listed on the page?","ui--upload-images-confirmation":"This will upload $1 file(s) to the wiki. Continue?","ui--app-is-loading":"Loading...","ui--source-wiki-info-heading":"Import images from the following wiki","ui--source-wiki-url-form-label":"Source Wiki URL","ui--source-wiki-script-path-form-label":"Source Wiki script path","ui--license-info-heading":"License","ui--license-dropdown-label":"Select a license","ui--license-dropdown-plc-message":"Select a license","ui--license-dropdown-no-license":"No license","ui--file-list-heading":"Import the following files","ui--number-of-files-info-summary":"$1 file(s) to import","ui--ignore-api-warnings-label":"Ignore warnings from the MediaWiki API?","ui--ignore-api-warnings-details":"When this option is selected, the gadget will attempt to upload images regardless of warnings from the MediaWiki API (e.g. files with identical image contents but with different names, or files that exist on the target wiki with the same name as files to be imported). You should disable this option if you are using this tool for the first time.","ui--import-page-contents-label":"Import page contents?","ui--import-page-contents-details":"When this option is selected, the gadget will also copy the file description from the corresponding File: page on the source wiki. This description is only copied over if a File: page of the same name does not yet exist on the target wiki. Be sure to check that the target wiki supports the templates that may be carried over when enabling this option.","ui--fetch-image-metadata-button":"Fetch image metadata","ui--upload-images-from-fetched-metadata":"Upload images using fetched metadata","ui--upload-images-from-user-urls":"Upload images using supplied URLs","ui--reupload-images":"Re-upload images","ui-notif--query-source-wiki":"Making a query to $1...","ui-notif--successfully-set-source-wiki":"Image metadata will be fetched by calling $1","ui-notif--successfully-fetched-image-metadata":"Successfully fetched metadata","ui-notif--successfully-uploaded-files":"Finishing up the last uploads of the batch...","ui--image-metadata-heading":"Image metadata information","ui--image-metadata-file-number-col-header":"No.","ui--image-metadata-filename-col-header":"File","ui--image-metadata-filesize-col-header":"Size","ui--image-metadata-static-url-col-header":"Static URL","ui--image-metadata-upload-status-col-header":"Upload Status","ui--image-metadata-static-url-not-found-notice":"Cannot find static URL","ui--image-metadata-list-none-queued":"There are currently no files in the queue to upload","ui--image-metadata-filter-unsuccessful-uploads":"Show failed uploads","ui--image-metadata-show-all-uploads":"Show all upload tasks","ui--file-upload-status-message-success":"Success","ui--file-upload-status-message-error":"Failed","ui--file-upload-status-message-queued":"Queued","ui--file-upload-status-message-uploading":"Uploading","ui--file-upload-status-message-warning":"File not uploaded - Got API Warning","error-init--forbidden-user":"Current user is forbidden from uploading via URL.","error-init--forbidden-user-more-details":"Make sure that your current wiki is set to allow file uploads by loading from URL, and that you have the user right <code>upload_by_url</code> granted by a wiki bureaucrat.","error-init--unexpected":"An unexpected error has occurred.","error-resp--csp":"Your network request to $1 is blocked due to Content Security Policy.","error-resp--failed-to-fetch-metadata":"Failed to fetch image metadata.","error-resp--no-metadata-is-fetched":"Fetch the image metadata first!","error-resp--no-image-to-upload":"There are no images available to upload. Images should include the File: namespace (e.g. File:Foo.png)","warning--exceeded-max-batch-size-limit":"You have entered $1 lines in the input box. Only $2 files will be uploaded when you click the 'Upload Files' button.","unexpected--upload-error":"An unexpected error has occurred","invalid--cannot-reach-source-wiki":"Unable to reach the Action API at $1","invalid--no-source-wiki-error-details":"The source wiki URL must not be empty","badreq--invalid-file-list-format":"At least one file must be specified. Filenames must start with the File: namespace.","upload-response--exists":"A file with the given name already exists.","upload-response--exists__no-change":"A file with the given name already exists and is exactly the same as the uploaded file.","upload-response--exists__duplicateversions":"A file with the given name already exists and an old version of that file is exactly the same as the uploaded file.","upload-response--page-exists":"A page with the given name already exists.","upload-response--was-deleted":"A file with the given name used to exist but has been deleted.","upload-response--duplicate":"The uploaded file exists under a different (or the same) name. Uploading a duplicate may be undesirable.","upload-response--duplicate-archive":"The uploaded used to exist under a different (or the same) name but has been deleted. This may indicate that the file is inappropriate and should not be uploaded.","upload-response--badfilename":"Bad filename"};i.messages.set(E);const m="MassCopyUpload",b="mass-copy-upload-container",h=50;let r,x,u,n,d;function _(e){r=e.reactive({sourceWikiBasicDomain:"",sourceWikiScriptPath:"/w",filesToImport:[],usesUserSuppliedUrls:!1,ignoreApiWarnings:!1,importPageContents:!1,inputsChanged:!1,targetWikiApi(){return new i.Api},sourceWikiApiPath(){return this.sourceWikiBasicDomain.trim()+this.sourceWikiScriptPath.trim()+"/api.php"},sourceWikiApi(){return new i.ForeignApi(this.sourceWikiApiPath(),{anonymous:!0})},numberOfFilesToImport(){return this.filesToImport.length},setFilesToImport(t){let s=t.trim().split(/\n+/).map(a=>a.trim()).filter(a=>a!=="").filter(a=>a.match(/^[Ff]ile:/));this.usesUserSuppliedUrls=s.length>0&&s.some(a=>a.includes("|")),this.usesUserSuppliedUrls&&(s=s.filter(a=>a.includes("|"))),this.filesToImport=s}}),x=e.reactive({options:[],selected:null}),u=e.reactive({initErrorCode:!1,sourceWikiErrorMessage:"",sourceWikiLoadingMessage:""}),n=e.reactive({imagesMetadata:[],firstUploadFinished:!1,filterUnsuccessful:!1,staticUrls(){return this.imagesMetadata.filter(function(t){return t.staticUrl!==null&&t.uploadStatusCss!=="success"})},hasFailedTasks(){return this.imagesMetadata.some(function(t){return t.uploadStatusCss!=="success"})}}),d=e.reactive({uploadProcessId:null,uploadCounter:null,availableUploadRequestCount:P})}function R({Vue:e,Codex:t,wgSiteName:s}){_(e);const a=e.createMwApp({template:`
      <gadget-overview/>
      <div v-if="errorMessagesStore.initErrorCode === false">
        <cdx-progress-indicator show-label>{{ $i18n( 'ui--app-is-loading' ).text() }}</cdx-progress-indicator>
      </div>
      <div v-else-if="errorMessagesStore.initErrorCode === null">
        <source-wiki-inputs/>
        <target-wiki-license/>
        <file-list-input/>
        <action-buttons/>
        <file-list-query-results/>
      </div>
      <div v-else>
        <no-permissions-notice />
      </div>
      `,components:{CdxProgressIndicator:t.CdxProgressIndicator},setup:()=>({errorMessagesStore:u})});if(a.component("gadget-overview",{template:`
      <div style="margin-bottom: 20px;">
        <p v-i18n-html:ui--overview-explanation></p>
        <p>{{ $i18n( 'ui--overview-batch-size-limit-message', limit ).text() }}</p>
      </div>
      `,setup:()=>({limit:k})}),a.component("no-permissions-notice",{template:`
      <div class="mass-upload-error-message">{{ initErrorHeading }}</div>
      <div 
        class="mass-upload-error-more-details" 
        v-if="initErrorDetailsMessageName !== null"
        v-i18n-html="initErrorDetailsMessageName"
      ></div>
      `,setup:()=>({errorMessagesStore:u}),computed:{initErrorHeading(){switch(this.errorMessagesStore.initErrorCode){case null:case!1:return null;case 0:return i.message("error-init--forbidden-user").text();case-1:return i.message("error-init--unexpected").text()}},initErrorDetailsMessageName(){switch(this.errorMessagesStore.initErrorCode){case null:case!1:return null;case 0:return"error-init--forbidden-user-more-details";case-1:return null}}}}),a.component("source-wiki-inputs",{template:`
      <h2>{{ $i18n( 'ui--source-wiki-info-heading' ).text() }}</h2>
      <div class="form-group">
        <div class="form-group-label">{{ $i18n( 'ui--source-wiki-url-form-label' ).text() }}</div>
        <div class="form-group-inputs">
          <cdx-text-input 
            id="source-wiki-api-url-input" input-type="url"
            placeholder="https://en.wikipedia.org"
            v-model="userInputsStore.sourceWikiBasicDomain" 
            @change="setChangeFlag"
            @blur="onChangeSourceWiki"
          />
        </div>
      </div>
      <div class="form-group">
        <div class="form-group-label">{{ $i18n( 'ui--source-wiki-script-path-form-label' ).text() }}</div>
        <div class="form-group-inputs">
          <cdx-text-input 
            id="source-wiki-api-script-path-input" 
            placeholder="/w"
            v-model="userInputsStore.sourceWikiScriptPath" 
            @change="setChangeFlag"
            @blur="onChangeSourceWiki"
          />
        </div>
      </div>
      <div class="form-group">
        <div class="form-group-label"></div>
        <div class="source-wiki-notif">
          <div class="error">
            {{ errorMessagesStore.sourceWikiErrorMessage }}
          </div>
          <div>
            {{ errorMessagesStore.sourceWikiLoadingMessage }}
          </div>
        </div>
        <div id="mw-api-notif">
        </div>
      </div>
      `,components:{CdxTextInput:t.CdxTextInput},setup:()=>({userInputsStore:r,errorMessagesStore:u}),methods:{onChangeSourceWiki(){r.inputsChanged&&S(),r.inputsChanged=!1},setChangeFlag(){r.inputsChanged=!0}}}),a.component("target-wiki-license",{template:`
      <h2>{{ $i18n( 'ui--license-info-heading' ).text() }}</h2>
      <div class="form-group">
        <div class="form-group-label">{{ $i18n( 'ui--license-dropdown-label' ).text() }}</div>
        <div class="form-group-inputs">
          <cdx-select 
            v-model:selected="licensesStore.selected"
            :menu-items="licensesStore.options"
            :default-label="dropdownDefaultLabel"
            style="width:100%"
          />
        </div>
      </div>
      `,components:{CdxSelect:t.CdxSelect},computed:{dropdownDefaultLabel(){return i.message("ui--license-dropdown-plc-message").text()}},setup:()=>({userInputsStore:r,licensesStore:x,errorMessagesStore:u})}),a.component("file-list-input",{template:`
      <div id='file-list-input-container'>
        <h2>{{ $i18n( 'ui--file-list-heading' ).text() }}</h2>
        <cdx-text-area 
          @change="setChangeFlag"
          @blur="onUpdateFileListInput"
          id="file-list-input" rows="10"
          placeholder="File:Foo.png
File:Bar.png
File:Baz.png
..." rows="10"
        />
        <div id='file-list-info-summary'>{{ $i18n( 'ui--number-of-files-info-summary', userInputsStore.numberOfFilesToImport() ).text() }}</div>
        <div id='file-list-exceeded-limit' class='error' v-if="exceededFileLimit">
          {{ $i18n( 'warning--exceeded-max-batch-size-limit', userInputsStore.numberOfFilesToImport(), limit ).text() }}
        </div>
      </div>
      `,components:{CdxTextArea:t.CdxTextArea},setup:()=>({userInputsStore:r,errorMessagesStore:u,limit:k}),computed:{exceededFileLimit(){return this.userInputsStore.numberOfFilesToImport()>this.limit}},methods:{onUpdateFileListInput:function(o){r.inputsChanged&&r.setFilesToImport(o.target.value),r.inputsChanged=!1},setChangeFlag(){r.inputsChanged=!0}}}),a.component("action-buttons",{template:`
      <div>
        <div class="action-buttons" v-if="!userInputsStore.usesUserSuppliedUrls">
          <cdx-button 
            action="progressive" type="primary" 
            @click="onClickedFetchMetadata"
            v-bind:disabled="uploadInProgress"
          >
            {{ $i18n( 'ui--fetch-image-metadata-button' ).text() }}
          </cdx-button>
          <cdx-button 
            action="progressive" type="primary" 
            @click="onClickedUploadFilesFromMetadata"
            v-bind:disabled="uploadInProgress"
          >
            {{ $i18n( 'ui--upload-images-from-fetched-metadata' ).text() }}
          </cdx-button>
          <cdx-button 
            action="progressive" type="primary" 
            v-if="(imagesMetadataStore.firstUploadFinished && !userInputsStore.inputsChanged && imagesMetadataStore.hasFailedTasks())"
            @click="onClickedReuploadFilesFromMetadata"
            v-bind:disabled="uploadInProgress"
          >
            {{ $i18n( 'ui--reupload-images' ).text() }}
          </cdx-button>
        </div>
        <div class="action-buttons" v-else>
          <cdx-button 
            action="progressive" type="primary" 
            @click="onClickedUploadFilesFromUserUrls"
            v-bind:disabled="uploadInProgress"
          >
            {{ $i18n( 'ui--upload-images-from-user-urls' ).text() }}
          </cdx-button>
          <cdx-button 
            action="progressive" type="primary" 
            v-if="(imagesMetadataStore.firstUploadFinished && !userInputsStore.inputsChanged && imagesMetadataStore.hasFailedTasks())"
            @click="onClickedReuploadFilesFromUserUrls"
            v-bind:disabled="uploadInProgress"
          >
            {{ $i18n( 'ui--reupload-images' ).text() }}
          </cdx-button>
        </div>
        <div class="action-checkbox">
          <cdx-checkbox v-model="userInputsStore.ignoreApiWarnings">
            {{ $i18n( 'ui--ignore-api-warnings-label' ).text() }}
            <template #description>
              {{ $i18n( 'ui--ignore-api-warnings-details' ).text() }}
            </template>
          </cdx-checkbox>
        </div>
        <div class="action-checkbox" v-if="!userInputsStore.usesUserSuppliedUrls">
          <cdx-checkbox v-model="userInputsStore.importPageContents">
            {{ $i18n( 'ui--import-page-contents-label' ).text() }}
            <template #description>
              {{ $i18n( 'ui--import-page-contents-details' ).text() }}
            </template>
          </cdx-checkbox>
        </div>
      </div>
      `,components:{CdxButton:t.CdxButton,CdxCheckbox:t.CdxCheckbox},setup:()=>({imagesMetadataStore:n,userInputsStore:r}),computed:{uploadInProgress(){return!!d.uploadProcessId}},methods:{onClickedFetchMetadata:$,onClickedUploadFilesFromMetadata(){v({fromMetadata:!0,isReupload:!1})},onClickedUploadFilesFromUserUrls(){v({fromMetadata:!1,isReupload:!1})},onClickedReuploadFilesFromMetadata(){v({fromMetadata:!0,isReupload:!0})},onClickedReuploadFilesFromUserUrls(){v({fromMetadata:!1,isReupload:!0})}}}),a.component("file-list-query-results",{template:`
      <div id='file-list-queried-container'>
        <h2>{{ $i18n( 'ui--image-metadata-heading' ).text() }}</h2>
        <cdx-progress-bar aria-label="Indeterminate progress bar" v-if="uploadInProgress" />
        <div class="action-buttons" v-if="imagesMetadataStore.firstUploadFinished">
          <cdx-button 
            action="progressive" type="primary"
            v-if="(!imagesMetadataStore.filterUnsuccessful && imagesMetadataStore.hasFailedTasks())"
            @click="toggleFilterUnsuccessful"
          >
            {{ $i18n( 'ui--image-metadata-filter-unsuccessful-uploads' ).text() }}
          </cdx-button>
          <cdx-button 
            action="progressive" type="primary" 
            v-if="imagesMetadataStore.filterUnsuccessful"
            @click="toggleFilterUnsuccessful"
          >
            {{ $i18n( 'ui--image-metadata-show-all-uploads' ).text() }}
          </cdx-button>
        </div>
        <cdx-table
          id="file-list-queried-table"
          :hideCaption="true"
          :columns="columns"
          :data="data"
          :use-row-headers="true"
        >
          <template #item-renderedFilename="{ row }">
            <span v-if="row.descriptionUrl === null">
              {{ row.title }}
            </span>
            <a v-bind:href="row.descriptionUrl" rel="nofollow noindex" target="_blank" v-else>
              {{ row.title }}
            </a>
          </template>
      
          <template #item-staticUrl="{ item }">
            <span v-if="item === null">
              {{ $i18n( 'ui--image-metadata-static-url-not-found-notice' ).text() }}
            </span>
            <a v-bind:href="item" rel="nofollow noindex" target="_blank" v-else>
              {{ item }}
            </a>
          </template>
      
          <template #item-renderedUploadStatus="{ row }">
            <div :class="['upload-status-code', row.uploadStatusCss]">
              {{ row.uploadStatusText }}
            </div>
            <div class="upload-details" v-if="!!row.uploadApiResponseDetails">
              {{ row.uploadApiResponseDetails }}
            </div>
          </template>
        </cdx-table>
        <div v-if="imagesMetadataStore.imagesMetadata.length === 0" class="file-list-query-info">
          {{ $i18n( 'ui--image-metadata-list-none-queued' ).text() }}
        </div>
      </div>
      `,setup:()=>({userInputsStore:r,errorMessagesStore:u,imagesMetadataStore:n,formatBytes:U}),components:{CdxButton:t.CdxButton,CdxTable:t.CdxTable,CdxProgressBar:t.CdxProgressBar},computed:{uploadInProgress(){return!!d.uploadProcessId},columns(){return[{id:"no",label:i.message("ui--image-metadata-file-number-col-header").text(),minWidth:"40px"},{id:"renderedFilename",label:i.message("ui--image-metadata-filename-col-header").text(),minWidth:"220px"},{id:"filesize",label:i.message("ui--image-metadata-filesize-col-header").text(),minWidth:"100px"},{id:"staticUrl",label:i.message("ui--image-metadata-static-url-col-header").text(),minWidth:"220px"},{id:"renderedUploadStatus",label:i.message("ui--image-metadata-upload-status-col-header").text(),minWidth:"150px"}]},data(){return n.imagesMetadata.filter(function(o){return n.filterUnsuccessful?o.uploadStatusCss!=="success":!0}).map(function(o,l){return{no:l+1,descriptionUrl:o.descriptionUrl,title:o.title,filesize:o.size===null?"-":U(o.size,2),staticUrl:o.staticUrl,uploadStatusCss:o.uploadStatusCss,uploadStatusText:o.uploadStatusText,uploadApiResponseDetails:o.uploadApiResponseDetails}})}},methods:{toggleFilterUnsuccessful(){n.filterUnsuccessful=!n.filterUnsuccessful}}}),document.title=i.msg("ui--document-webpage-title",s),document.getElementById("firstHeading").innerText=i.msg("ui--document-title"),document.addEventListener("securitypolicyviolation",O),!document.getElementById(b)){const o=document.createElement("div");o.id=b,document.getElementById("mw-content-text").innerHTML="",document.getElementById("mw-content-text").appendChild(o)}a.mount("#"+b),j(),N().then(()=>{u.initErrorCode=null}).catch(o=>{u.initErrorCode=o})}function $(){if(r.filesToImport.length===0){i.notify(i.message("badreq--invalid-file-list-format").text());return}window.confirm(i.message(n.imagesMetadata.length===0?"ui--load-image-metadata-list-confirmation":"ui--clear-image-metadata-list-confirmation").text())&&S(!0).then(function(e){e&&L()})}function v({fromMetadata:e=!1,isReupload:t=!1}){const s=e?n.staticUrls().length:r.numberOfFilesToImport();if(s===0){i.notify(i.message(e&&!t?"error-resp--no-metadata-is-fetched":"error-resp--no-image-to-upload").text());return}window.confirm(i.message("ui--upload-images-confirmation",s).text())&&(!e&&!t&&q(),B())}function L(){if(r.usesUserSuppliedUrls){console.error(m,"fetchImageMetadata should not be called when userInputsStore.usesUserSuppliedUrls == true");return}const e=[];for(let a=0;a<Math.ceil(r.filesToImport.length/h);a++)e.push(r.filesToImport.slice(a*h,(a+1)*h));const t=r.sourceWikiApi(),s=e.map(function(a,o){return new Promise(function(l,c){t.get({action:"query",format:"json",prop:"imageinfo|revisions",titles:a.join("|"),iiprop:"url|size|mediatype",rvprop:"content",rvslots:"*"}).done(function(g){const f=Object.values(g.query.pages).map(function(p,M){const I=p.title;if(p.missing!==void 0)return{index:o*h+M,pageid:null,title:I.replace(/^[Ff]ile:/,""),exists:!1,descriptionUrl:null,staticUrl:null,size:null,pageContents:null,uploadStatusCss:"error",uploadStatusText:i.message("ui--file-upload-status-message-error").text(),uploadApiResponseDetails:null};const y=(p.imageinfo||[{}])[0];return{index:o*h+M,pageid:p.pageid,title:I.replace(/^[Ff]ile:/,""),exists:!0,descriptionUrl:y.descriptionurl||null,staticUrl:y.url||null,size:y.size||null,pageContents:(p.revisions||[]).length===0?null:((p.revisions[0].slots||{}).main||{})["*"]||null,uploadStatusCss:"pending",uploadStatusText:i.message("ui--file-upload-status-message-queued").text(),uploadApiResponseDetails:null}});l(f)}).fail(c)})});Promise.allSettled(s).then(function(a){const o=[];a.forEach(function(l){l.value.forEach(function(c){o.push(c)})}),n.imagesMetadata=o,n.firstUploadFinished=!1,i.notify(i.message("ui-notif--successfully-fetched-image-metadata").text(),{type:"success"})}).catch(function(a){console.error(m,a),i.notify(i.message("error-resp--failed-to-fetch-metadata").text(),{type:"error"})})}function q(){if(!r.usesUserSuppliedUrls){console.error(m,"loadUserUrls should not be called when userInputsStore.usesUserSuppliedUrls == false");return}const e=[];for(let t=0;t<r.filesToImport.length;t++){const s=r.filesToImport[t],a=/^([Ff]ile\s*:\s*.+?)\s*\|\s*(https?:\/\/.+)$/.exec(s);if(a===null)continue;const[o,l,c]=a;e.push({index:t,pageid:null,title:l.replace(/^[Ff]ile:/,""),exists:!0,descriptionUrl:null,staticUrl:c,size:null,uploadStatusCss:"pending",uploadStatusText:i.message("ui--file-upload-status-message-queued").text(),uploadApiResponseDetails:null})}n.imagesMetadata=e,n.firstUploadFinished=!1}function B(){if(d.uploadProcessId){console.error(m,"An upload is already in progress.");return}d.uploadCounter=0,d.uploadProcessId=setInterval(function(){if(d.availableUploadRequestCount<=0){console.log(m,"Maximum number of simultaneous upload requests exceeded. Pausing upload request.");return}let e=n.imagesMetadata[d.uploadCounter++];for(;e!==void 0&&(!e.staticUrl||e.uploadStatusCss==="success");)e=n.imagesMetadata[d.uploadCounter++];if(e===void 0){d.uploadProcessId&&(n.firstUploadFinished=!0,n.filterUnsuccessful=!1,clearInterval(d.uploadProcessId),d.uploadProcessId=null,i.notify(i.message("ui-notif--successfully-uploaded-files").text(),{type:"success"}));return}e.uploadStatusCss="uploading",e.uploadStatusText=i.message("ui--file-upload-status-message-uploading").text(),e.uploadApiResponseDetails=null,d.availableUploadRequestCount--,r.targetWikiApi().postWithEditToken({action:"upload",format:"json",filename:e.title,url:e.staticUrl,text:r.importPageContents?e.pageContents||void 0:(x.selected||"")===""?void 0:`== {{safesubst:MediaWiki:License-header}} ==
{{`+x.selected+"}}",ignorewarnings:r.ignoreApiWarnings?1:void 0}).done(D(n,e.index)).fail(z(n,e.index)).always(function(){d.availableUploadRequestCount++})},Math.max(W,600))}function D(e,t){return function(s){const a=s.upload.result;let o,l;switch(a){case"Success":o=i.message("ui--file-upload-status-message-success").text(),l="success";break;case"Warning":o=i.message("ui--file-upload-status-message-warning").text(),l="warning";const c=G(s.upload.warnings);e.imagesMetadata[t].uploadApiResponseDetails=c.join(", ");break;case"Failed":default:o=i.message("ui--file-upload-status-message-error").text(),l="error";const g=(s.error||{}).info||i.message("unexpected--upload-error").text();e.imagesMetadata[t].uploadApiResponseDetails=g}e.imagesMetadata[t].uploadStatusCss=l,e.imagesMetadata[t].uploadStatusText=o}}function z(e,t){return function(s,a){const o=(a.error||{}).info||i.message("unexpected--upload-error").text();e.imagesMetadata[t].uploadStatusCss="error",e.imagesMetadata[t].uploadStatusText=i.message("ui--file-upload-status-message-error").text(),e.imagesMetadata[t].uploadApiResponseDetails=o}}function N(){return new Promise(function(e,t){r.targetWikiApi().getUserInfo().done(function(s){s.rights.indexOf("upload_by_url")<0?t(0):e(!0)}).fail(function(){t(-1)})})}function S(e){return new Promise(function(t){if(r.sourceWikiBasicDomain===""){u.sourceWikiErrorMessage=i.message("invalid--no-source-wiki-error-details").text(),t(!1),e&&i.notify(i.message("invalid--no-source-wiki-error-details",r.sourceWikiApiPath()).text(),{type:"error"});return}u.sourceWikiLoadingMessage=i.message("ui-notif--query-source-wiki",r.sourceWikiApiPath()).text(),u.sourceWikiErrorMessage="",r.sourceWikiApi().getUserInfo().done(function(){u.sourceWikiLoadingMessage=i.message("ui-notif--successfully-set-source-wiki",r.sourceWikiApiPath()).text(),u.sourceWikiErrorMessage="",t(!0)}).fail(function(s,a){console.error(m,"Failed to assert Foreign MediaWiki API"),console.error(m,s,a),u.sourceWikiLoadingMessage="",u.sourceWikiErrorMessage=i.message("invalid--cannot-reach-source-wiki",r.sourceWikiApiPath()).text(),t(!1),e&&i.notify(i.message("invalid--cannot-reach-source-wiki",r.sourceWikiApiPath()).text(),{type:"error"})})})}function O(){i.notify(i.message("error-resp--csp",r.sourceWikiApiPath()).text(),{type:"error"}),u.sourceWikiErrorMessage=i.message("invalid--cannot-reach-source-wiki",r.sourceWikiApiPath()).text()}function j(){let e;A.get(i.util.getUrl("MediaWiki:Licenses",{action:"raw"})).done(function(t){e=C(t,1)}).fail(function(t){console.error(m,"Failed to fetch license information"),console.error(m,t),e=[]}).always(function(){e.unshift({label:i.message("ui--license-dropdown-no-license").text(),data:null}),x.options=e})}function U(e,t){if(!+e)return"0 B";const s=1024,a=(t||-1)<0?0:t,o=["B","KB","MB","GB"],l=Math.floor(Math.log(e)/Math.log(s));return""+parseFloat((e/Math.pow(s,l)).toFixed(a))+" "+o[l]}function H(e,t){e=e.replace(new RegExp("^\\*{"+t+"}\\s*"),"");const s=e.match(/^(.*)\s*\|\s*(.*?)$/);return s===null?{label:e,value:e}:{label:s[2],value:s[1]}}function C(e,t){if(t>5)return[];let s=new RegExp("(?<=^|\\n)[^]+?(?=\\n\\*{"+t+"}(?!\\*)|$)","g"),a=Array.from(e.matchAll(s));s=new RegExp("^(\\*{"+t+"}(?!\\*)[\\r\\t ]*.*)[\\r\\t ]*(?:\\n\\s*([^]*)\\s*|)$");const o=[];for(let l=0;l<a.length;l++){let c=a[l][0].trim().match(s),g=H(c[1],t),f=c[2]||"";if(f===""){o.push(g);continue}g.disabled=!0,o.push(g),f=C(f,t+1);for(let p=0;p<f.length;p++)o.push(f[p])}return o}function G(e){const t=[];return e.exists!==void 0&&((e.exists||{})["no-change"]!==void 0?t.push(i.message("upload-response--exists__no-change").text()):(e.exists||{}).duplicateversions!==void 0?t.push(i.message("upload-response--exists__duplicateversions").text()):t.push(i.message("upload-response--exists").text())),["page-exists","was-deleted","duplicate","duplicate-archive","badfilename"].forEach(function(s){e[s]!==void 0&&t.push(i.message("upload-response--"+s).text())}),t}const w=i.config.get(["wgPageName","wgSiteName","wgAction"]);w.wgAction==="view"&&w.wgPageName===T&&i.loader.using(["vue","@wikimedia/codex"]).then(function(e){const t=e("vue"),s=e("@wikimedia/codex");R({Vue:t,Codex:s,wgSiteName:w.wgSiteName}),i.util.addCSS("#mass-copy-upload-container .source-wiki-notif{font-size:smaller}#mass-copy-upload-container .mass-upload-error-message{font-weight:bold;font-size:larger;margin-top:50px;margin-bottom:10px;color:red}#mass-copy-upload-container .action-buttons{text-align:center;vertical-align:middle;margin-top:20px}#mass-copy-upload-container .action-checkbox .cdx-label__description,#mass-copy-upload-container .action-checkbox .cdx-label__label{text-align:left}#mass-copy-upload-container .action-checkbox .cdx-label__description{font-size:smaller}#mass-copy-upload-container .action-checkbox .cdx-checkbox{margin-top:15px}#mass-copy-upload-container .form-group{display:flex;flex-direction:row;gap:20px;padding-bottom:10px;justify-content:flex-start;align-items:center}#mass-copy-upload-container .form-group-label{width:200px}#mass-copy-upload-container .form-group-inputs{flex-grow:2}#mass-copy-upload-container .form-group-inputs input{width:100%}@media (max-width:500px){#mass-copy-upload-container .form-group{flex-direction:column;align-items:flex-start;gap:5px}#mass-copy-upload-container .form-group-label{width:100%}#mass-copy-upload-container .form-group-inputs{width:100%}}#mass-copy-upload-container #file-list-input-container{margin-bottom:40px}#mass-copy-upload-container #file-list-info-summary,#mass-copy-upload-container #file-list-exceeded-limit{text-align:right}#mass-copy-upload-container #ignore-mw-warning-input{margin-left:10px}#mass-copy-upload-container #ignore-mw-warning-input > input{margin-right:5px}#mass-copy-upload-container #file-list-queried-table,#mass-copy-upload-container #file-list-queried-table thead,#mass-copy-upload-container #file-list-queried-table tbody,#mass-copy-upload-container #file-list-queried-table tr{width:100%}#mass-copy-upload-container #file-list-queried-table td *{word-break:break-word}#mass-copy-upload-container .upload-status-code{text-align:center;font-size:0.9rem !important}#mass-copy-upload-container .upload-status-code.pending{background-color:#c9f9f5;color:#000000}#mass-copy-upload-container .upload-status-code.success{background-color:#0eda1b;color:#ffffff}#mass-copy-upload-container .upload-status-code.warning{background-color:#a58012;color:white}#mass-copy-upload-container .upload-status-code.error{background-color:#d70808;color:white}#mass-copy-upload-container .upload-status-code.uploading{background-color:#7ce1d8;color:#000000}#mass-copy-upload-container .upload-details{font-size:0.7rem !important;text-align:center;margin-top:3px}#mass-copy-upload-container .file-list-query-info{font-weight:bold;text-align:center}#mass-copy-upload-container #file-list-exceeded-limit{font-size:small}")})})(mediaWiki)},{css:[]},{},{},null]})})(mediaWiki);
