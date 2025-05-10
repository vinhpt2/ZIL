var SysWfRunJob={
	run:function(p){
		if(p.records.length){
			var self=this;
			this.job=p.records[0];
			this.conf=p.config;
			this.readonly=p.readonly;
			
			var wfconf=_context.workflow[this.job.jobtypeid];
			if(wfconf)
				this.showWorkflow(wfconf);
			else NUT.ds.select({url:NUT.URL+"wfjobtype",select:"jobtypedata,users",siteid:_context.curApp.siteid,where:["jobtypeid","=",this.job.jobtypeid]},function(res){
				if(res.length){
					self.users=res[0].users;
					wfconf=res[0].jobtypedata;
					_context.workflow[self.job.jobtypeid]=wfconf;
					self.showWorkflow(wfconf);
				}
			});
			
		}else NUT.tagMsg("No Job selected!","yellow");
	},
	showWorkflow:function(wfconf){
		var self=this;
		var conf=_context.winconfig[this.job.windowid];
		if(conf){
			conf.tabs[0].tempWhere=[conf.tabs[0].columnkey,"=",this.job.recordid];
			this.showDlgWorkflow(wfconf,conf);
		}else{
			NUT.ds.select({url:NUT.URL+"syscache",siteid:_context.curApp.siteid,where:["windowid","=",this.job.windowid]},function(res){
				if(res.length){
					conf=NUT.configWindow(zipson.parse(res[0].config),JSON.parse(res[0].layout));
					conf.tabid=conf.windowid;
					conf.tabs[0].tempWhere=[conf.tabs[0].columnkey,"=",self.job.recordid];
					var needCaches=[];
					for(key in conf.needCache)if(conf.needCache.hasOwnProperty(key)&&!_context.domain[key])
						needCaches.push(conf.needCache[key]);
					self.showDlgWorkflow(wfconf,conf,needCaches);
				}
			});
		}
	},
	showDlgWorkflow:function(wfconf,conf,needCaches){
		var self=this;
		var id="divCom_SysWfRunJob";
		w2popup.open({
			title: '🏃 <i>Run workflow</i> - '+ conf.windowname,
			width: 920,
			height: 800,
			modal:true,
			body: '<div class="nut-full"><div id="divJob_Title"></div></div>',
			onOpen:function(evt){
				evt.onComplete=function(){
					a=createWindowTitle(conf.windowid,divJob_Title,true);
					needCaches?cacheDomainAndOpenWindow(a.div,conf,needCaches,0):buildWindow(a.div,conf,0);
					a.innerHTML=conf.windowname;
					
					var a=createWindowTitle(id,divJob_Title,true);
					w2ui[id]?w2ui[id].render(a.div):
					$(a.div).w2layout({
						name: id,
						panels: [{ type: 'top', size: '26px', content: '<div id="divJob_Top" class="nut-full"></div>' },
							{ type: 'left', size: '300px', resizable: true, content: '<div id="divJob_Left" class="nut-full"></div>' },
							{ type: 'main', content: '<div id="divJob_Main" style="background:white" class="nut-full"></div>' }]
					});
					
					var bpmnViewer = new BpmnJS({ container: divJob_Main });
					bpmnViewer.importXML(wfconf).then(function(){
						var elementRegistry=bpmnViewer.get("elementRegistry");
						eleCurrent=elementRegistry.get(self.job.currentstep);
						if(eleCurrent){
							eleCurrent.businessObject.di.set('fill','lime');
							bpmnViewer.get("graphicsFactory").update(eleCurrent.waypoints?'connection':'shape',eleCurrent,elementRegistry.getGraphics(eleCurrent));
							var stepInfo={current:eleCurrent,back:[],next:[]};
							for(var i=0;i<eleCurrent.incoming.length;i++)
								stepInfo.back.push(eleCurrent.incoming[i].source);
							for(var i=0;i<eleCurrent.outgoing.length;i++)
								stepInfo.next.push(eleCurrent.outgoing[i].target);
						}else NUT.tagMsg("Start step not found!","yellow");
						if(!self.readonly){
							id="divJob_Top";
							div=document.getElementById(id);
							w2ui[id]?w2ui[id].render(div):
							$(div).w2toolbar({
								name: id,
								items: [{type:'button',id:"SAVE",text:'💾 Save',tooltip:"Save job"},{type:'spacer',id:"SPACE"},{type:'button',id:"SEND",text:(stepInfo.next.length?'✔️ Send':'✔️ Finish'),tooltip:"Send job"},{type:'button',id:"BACK",text:'⬅ Back',tooltip:"Back job",disabled:!stepInfo.back.length},{type:'break'},{type:'html',id:'STEP',html:"Current step: <b style='color:green'>"+stepInfo.current.businessObject.name+"</b>"}],
								onClick:Com_SysWfRunJob.tool_onClick,
								tag:{config:self.conf,stepInfo:stepInfo,users:self.users}
							});
							a.innerHTML=self.conf.tabname;
						}else a.innerHTML="Job";
					});
					

					id="divJob_Left";
					var div=document.getElementById(id);
					w2ui[id]?w2ui[id].render(div):
					$(div).w2form({
						name:id,
						fields:w2ui["divform_"+self.conf.tabid].fields,
						record:self.job,
						recid:self.conf.columnkey,
						onChange:field_onChange
					});
					
				}
			}
		});
	},
	tool_onClick:function(evt){
		var conf=this.tag.config;
		var stepInfo=this.tag.stepInfo;
		var users=this.tag.users.split(",");
		
		var item=evt.subItem?evt.subItem:evt.item;
		var form=w2ui["divJob_Left"];
		var tagNode="#tb_divJob_Top_item_SPACE";
		switch(item.id){
			case "SAVE":
				if(form.validate(true).length)return;
				var change=form.getChanges();
				var columnkey=conf.columnkey;

				if(!NUT.isObjectEmpty(change)){
					var data={};//remove "" value
					for(var key in change)if(change.hasOwnProperty(key)&&key!=columnkey)
						data[key]=(change[key]===""?null:change[key]);
					var recid=form.record[columnkey];
					var p={url:conf.urledit,where:[columnkey,"=",recid],data:data};
					NUT.ds.update(p,function(res){
						NUT.tagMsg("Record updated.","lime",tagNode);
					});
					form.applyChanges();
				}else NUT.tagMsg("No change!","yellow",tagNode);
				break;
			case "SEND":
			case "BACK":
				var next=(item.id=="SEND"?stepInfo.next:stepInfo.back);
				if(next.length){
					var str1='<select id="cboJob_NextStep">';
					for(var i=0;i<next.length;i++)
						str1+='<option value="'+next[0].id+(i==0?'" selected>':'">')+next[i].businessObject.name+'</option>';
					
					var str2='<select id="cboJob_ToUser">';
					for(var i=0;i<users.length;i++)
						str2+=(users[i]==(item.id=="SEND"?next[0].businessObject.$attrs["Assign"]:Com_SysWfRunJob.job.sentfrom)?'<option selected>':'<option>')+users[i]+'</option>';
						
					w2popup.message({
						speed:0,
						width:400,
						height:200,
						body: '<table style="margin:auto;width:100%"><caption style="background:lightgray"><i>'+item.id+'</i></caption><tr><td align="right">Step</td><td>'+str1+'</select></td></tr><tr><td align="right">To user</td><td>'+str2+'</td></tr><tr><td align="right">Note</td><td><textarea id="txtJob_Note"></textarea></td></tr></table>',
						buttons: '<button class="w2ui-btn" onclick="w2popup.message()">Cancel</button><button class="w2ui-btn" onclick="Com_SysWfRunJob.send()">Ok</button>'
					});
				}else{//finish workflow
					w2confirm('<span style="color:green">Finish workflow?</span>').yes(function(){
						Com_SysWfRunJob.send(true);
					});
				}
				break;
		}
	},
	send:function(isFinish){
		var job=this.job;
		var data=isFinish?{assignstatusid:null,sentfrom:job.assignedto,assignedto:job.assignedto,jobstatusid:2}:
			{assignstatusid:null,sentfrom:job.assignedto,assignedto:cboJob_ToUser.value,currentstep:cboJob_NextStep.value,note:txtJob_Note.value};
		
		NUT.ds.update({url:NUT.URL+"wfjob",where:["jobid","=",job.jobid],data:data},function(){
			var data=isFinish?{assignedto:job.assignedto,stepid:job.currentstep}:{description:txtJob_Note.value,assignedto:cboJob_ToUser.value,stepid:cboJob_NextStep.value};
			data.updatetime=new Date();
			data.siteid=_context.user.siteid;
			data.sentfrom=job.assignedto;
			data.jobid=job.jobid;			
			NUT.ds.insert({url:NUT.URL+"wfhistory",data:data});
			
			NUT.tagMsg("Step done.","lime");
			w2popup.close();
		});
	}
}