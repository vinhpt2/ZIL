import { w2ui, w2layout, w2toolbar, w2form, w2utils, w2popup, w2sidebar, w2tooltip, w2confirm, w2tabs, w2menu, w2grid } from "../../lib/w2ui.es6.min.js";
import { SqlREST } from "../js/sqlrest.js";
NUT.ds = SqlREST;
NUT.w2ui = w2ui;
NUT.w2utils = w2utils;
NUT.w2confirm = w2confirm;
NUT.w2popup = w2popup;

var _bpmnModeler=null;

window.onload = function () {
	n$.user={};
	var strs=(window.location.search.substr(1)).split("&");
	for(var i=0;i<strs.length;i++){
		var str=strs[i].split("=");
		n$.user[str[0]]=str[1];
	}

	SqlREST.token = "Bearer " + n$.user.token;
	document.body.innerHTML = "<div id='divApp'></div>";
	w2utils.locale(localStorage.getItem("locale") || w2utils.settings.locale).then(function (evt) {
		n$.locale = evt.data.locale.substr(0, 2);
		n$.phrases = evt.data.phrases;

		(w2ui["layApp"] || new w2layout({
			name: "layApp",
			style: "width:100%;height:100%;top:0;margin:0",
			panels: [
				{ type: 'top', size: 38, html: '<i class="nut-link"><img id="imgLogo " width="20" height="20" src="favicon.ico"/> Workflow 1.0</i>' },
				{ type: 'left', size: NUT.isMobile ? "100%" : 260, resizable: true, html: '<div id="divLeft" class="nut-full"></div>' },
				{ type: 'right', size: 500, resizable: true, html: '<div id="frmRight" style="width:100%;height:200px"></div>' },
				{ type: 'main', html: '<div id="divMain" style="background:white;width:100%;height:100%"><h2>Create new or open a workflow</h2></div>' },
				{ type: 'preview', size: 200, resizable: true, html: '<div id="frmBottom" style="width:100%;height:100%"></div>' }
			],
		})).render(divApp);
		var where=["siteid","=",n$.user.siteid];
		  
		NUT.ds.select({url:NUT.URL+"n_app",order:"orderno",where:where},function(res){
			if(res.success&&res.result.length){
				var appItems=[],lookup={},nodes=[];
				for(var i=0;i<res.result.length;i++){
					var item=res.result[i];
					appItems.push({id:item.appid,text:item.appname});
					var node={id:"app_"+item.appid,text:item.appname,expanded:true};
					nodes.push(node);
					lookup[item.appid]=node;
				}
				//loadMenu
				
				NUT.ds.select({url:NUT.URL+"n_workflow",order:"wfname",where:where},function(res){
					if (res.success) {
						for(var i=0;i<res.result.length;i++){
							var wf=res[i];
							var node={count:'<span onclick="delete_onClick('+wf.workflowid+')" title="Delete">❌</span>', id:wf.workflowid, text: wf.wfname, img: 'icon-page', tag:wf.workflowid};
							var parent=lookup[wf.appid];
							if(!parent.nodes)parent.nodes=[];
							parent.nodes.push(node);
						};
						(w2ui['divLeft']||new w2sidebar({
							name:'divLeft',
							nodes: nodes,
							topHTML:"<button style='margin:3px;padding:5px' onclick='openWorkflow()'>📝 New workflow</button><button style='float:right;margin:3px;padding:5px' onclick='loadMenu()' title='Refresh'> ⭯ </button>",
							onClick:menu_onClick
						})).render(divLeft);
					}else NUT.notify("⛔ ERROR: " + res.result, "red");
				});
				NUT.ds.select({url:NUT.URL+"n_user",where:where},function(res2){
					var userItems=[];
					for(var i=0;i<res2.result.length;i++){
						var item=res2.result[i];
						userItems.push({id:item.userid,text:item.username});
					}
					
					NUT.ds.select({url:NUT.URL+"n_table",where:where},function(res3){
						var tblItems=[];
						for(var i=0;i<res3.result.length;i++){
							var item=res3.result[i];
							tblItems.push({id:item.tableid,text:item.tablename});
						}
					
						(w2ui['frmBottom']||new w2form({
							name: 'frmBottom',
							fields: [
								{field:'wfname',type:"text",required:true,html:{label:"Name",column:0}},
								{field:'duration',type:"int",required:true,html:{label:"Duration",column:1,text:'@numdaycomplete'}},
								{field:'timeunit',type:"select",required:true,html:{label:"",anchor:"@numdaycomplete"},options:{items:[{id:1,text:"day"},{id:2,text:"hour"},{id:3,text:"minute"}]}},
								{field:'appid',type:"select",required:true,html:{label:"Application",column:0},options:{items:appItems}},
								{field:'tableid',type:"select",required:true,html:{label:"Table",column:1},options:{items:tblItems}},
								{field:'startstep',type:"text",required:true,html:{label:"Start Step",column:0,text:" <input type='button' onclick='butUsers_onClick(this.previousElementSibling)' value=' ... '/>"}},
								{field:'description',type:"text",html:{label:"Description",column:1}}
							],
							actions: {
								"⛌ Close": function () {
									w2popup.close();
								},
								"✔️ Save": function (evt) {
									if(this.validate(true).length)return;
									var startStep="StartEvent_1";
									if(_bpmnModeler.get("elementRegistry").get(startStep)){
										var self=this;
										_bpmnModeler.saveXML().then(function(xml){
											self.record.jobtypedata=xml.xml;
											self.record.createdate=new Date();
											self.record.jobstepstart=startStep;
											self.record.siteid=user.siteid;
											self.record.jobtypeid?NUT_DS.update({srl:"wfjobtype",where:["jobtypeid","=",self.record.jobtypeid],data:self.record},function(res){NUT.tagMsg("Record updated.","lime")}):
											NUT_DS.insert({srl:"wfjobtype",data:self.record},function(res){if(res.length){self.record.jobtypeid=res[0].jobtypeid;loadMenu();NUT.tagMsg("Record inserted.","lime")}});
											
										});
									} else NUT.tagMsg("Start-step not found","red");
								}
							}
						})).render(frmBottom);
						frmBottom.style.display="none";

						(w2ui['frmRight']||new w2form({
							name:'frmRight',
							header: 'Step',
							fields:[
								{field:'Name',type:"text",disabled:true},
								{field:'Duration',type:"float"},
								{field:'Assign',type:"select",options:{items:userItems}}
							],
							actions: {
								"✔️ Save": function (evt) {
									this.element.businessObject.$attrs.Duration=this.record.Duration;
									this.element.businessObject.$attrs.Assign=this.record.Assign;
								}
							}
						})).render(frmRight);
						frmRight.style.display="none";
					});
				});
			}else NUT.notify("⚠️ Site has no application", "yellow");
		});
	});
}
function delete_onClick(id){
	w2confirm('<span style="color:red">Delete selected workflow?</span>').yes(function(){
		 NUT_DS.delete({srl:"wfjobtype",where:["jobtypeid","=",id]},function(res){
			loadMenu();
		});
	 });
}
function menu_onClick(evt){
	var tag = evt.object.tag;
	if(tag){
		NUT_DS.select({srl:"wfjobtype",where:["jobtypeid","=",tag]},function(res){
			if(res.length){
				openWorkflow(res[0]);
			}
		});
	}
}
window.openWorkflow=function(wf) {
      // modeler instance
	divMain.innerHTML="";
	frmRight.style.display="";
	frmBottom.style.display="";
	
	_bpmnModeler = new BpmnJS({ container: divMain });
	_bpmnModeler.on('element.click',element_onClick);

	var form=w2ui["frmBottom"];
	if(wf){
		form.record=wf;
		form.refresh();
		_bpmnModeler.importXML(wf.jobtypedata);
	} else _bpmnModeler.createDiagram();
}

function element_onClick(evt){
	var ele=evt.element;
	
	var form=w2ui["frmRight"];
	form.record={
		Name:ele.businessObject.name,
		Duration:ele.businessObject.$attrs.Duration,
		Assign:ele.businessObject.$attrs.Assign
	}
	form.refresh();
	if(evt.element.parent)
		form.unlock();
	else
		form.lock();
	
	form.element=ele;
}

function butUsers_onClick(input){
	NUT_DS.select({srl:"sysgroup",order:"groupname",where:["siteid","=",_context.user.siteid]},function(groups){
		var grpLookup={};
		for(var i=0;i<groups.length;i++){
			var group=groups[i];
			grpLookup[group.groupid]=group.groupname;
		}
		NUT_DS.select({srl:"sysuser",where:["siteid","=",_context.user.siteid]},function(res){
			var fields=[];
			for(var i=0;i<res.length;i++){
				var user=res[i];
				var fld={field:user.username,type:'checkbox',html:{column:i++%3,group:grpLookup[user.groupid]}};
				fields.push(fld);
			}
			
			var lookup={};
			if(input.value){
				var users=input.value.split(",");
				for(var i=0;i<users.length;i++)lookup[users[i].username]=true;
			}
			var id="divDlg_Users";
			var self=this;
			w2popup.open({
				title: '<i>Users in workflow</i>',
				modal:true,
				width: 700,
				height: 500,
				body: '<div id="'+id+'" class="nut-full"></div>',
				onOpen:function(evt){
					evt.onComplete=function(){
						var div=document.getElementById(id);
						w2ui[id]?w2ui[id].render(div):
						$(div).w2form({ 
							name: id,
							fields: fields,
							record:lookup,
							actions: {
								"⛌ Cancel":function(){
									w2popup.close();
								},
								"✔️ Ok":function(){
									var values=[];
									for(var key in this.record)if(this.record.hasOwnProperty(key))
										values.push(key);
									w2ui['frmBottom'].setValue(input.id,values.toString());
									w2ui['frmBottom'].refresh(input.id);
									w2popup.close();
								}
							}
						});
					}
				}
			});
		});
	});
}