var SysWfManager={
	run:function(div){
		this.div=div;
		var self=this;
		NUT.ds.select({url:NUT.URL+"wfjobtype",where:["appid","=",_context.curApp.appid]},function(res){
			var str='<select id="cboJobM_Jobtype" onchange="Com_SysWfManager.cboJobtype_onChange(this.value)">';
			for(var i=0;i<res.length;i++)
				str+='<option value="'+res[i].jobtypeid+'">'+res[i].jobtypename+'</option>';
			
			self.div.innerHTML='<div id="divJobM_Top"></div><div id="divJobM_Main" class="nut-full" style="background:white"></div>';
			
			id="divJobM_Top";
			var div=document.getElementById(id);
			w2ui[id]?w2ui[id].render(div):
			$(div).w2toolbar({
				name: id,
				items: [{type:'html',html:"&nbsp;Workflow: "+str+"</select>"},{type:'break'},{type:'html',html:"&nbsp;User: <select id='cboJobM_User'></select>"},{type:'html',html:"&nbsp;Status: <select id='cboJobM_Status'></select>"},{type:'spacer'},{type:'html',html:"Total: <b id='labJobM_Total'></b> job(s)"}]
			});
			
			if(res.length)self.cboJobtype_onChange(res[0].jobtypeid);
		});
	},
	cboJobtype_onChange:function(val){
		if(val){
			NUT.ds.select({url:NUT.URL+"wfjob",where:["jobtypeid","=",val]},function(res){
				if(res.length){
					divJobM_Main.innerHTML="";
					for(var i=0;i<res.length;i++){
						var job=res[i]
						var div=document.createElement("div");
						div.style.margin="10px";
						var bar=document.createElement("div");
						bar.className="wf-bar";
						bar.tag=job;
						bar.onclick=function(){
							var self=this;
							NUT.ds.select({url:NUT.URL+"nv_tab_table",where:["tablename","=","wfjob"]},function(res){
								if(res.length){
									var tag=res[0].windowid;
									var conf=_context.winconfig[tag];
									if(conf){
										runComponent("Com_SysWfRunJob",{records:[this.tag],config:conf.tabs[0],readonly:true});
									}else{
										NUT.ds.select({url:NUT.URL+"syscache",where:["windowid","=",tag]},function(res){
											if(res.length){
												conf=NUT.configWindow(zipson.parse(res[0].config),JSON.parse(res[0].layout));
												_context.winconfig[tag]=conf;
												runComponent("Com_SysWfRunJob",{records:[self.tag],config:conf.tabs[0],readonly:true});
											}
										});
									}
								}
							})
						};
						div.appendChild(bar);
						var a=document.createElement("a");
						a.className="nut-link";
						a.innerHTML=job.jobname+" - "+job.assignedto;
						a.tag=job;
						a.onclick=function(){
							if(this.div){
								this.div.style.display=(this.checked?"":"none");
								this.checked=!this.checked;
							} else {
								var detail=null;
								if(this.parentNode.childNodes.length==3){
									detail=this.parentNode.childNodes[2].tBodies[0];
								} else {
									var tbl=document.createElement("table");
									tbl.border="1px";
									tbl.width="100%";
									tbl.createCaption().innerHTML="<b><i>Job's history</i></b>";
									this.parentNode.appendChild(tbl);
									detail=tbl.createTBody();
									this.div=tbl;
								}
								NUT.ds.select({url:NUT.URL+"wfhistory",where:["jobid","=",this.tag.jobid]},function(res){
									for(var i=0;i<res.length;i++){
										var rec=res[i];
										var row=detail.insertRow();
										for(var key in rec)if(rec.hasOwnProperty(key)){
											var cell=row.insertCell();
											cell.innerHTML=rec[key];
										}
									}
								});
							}
						};
						div.appendChild(a);
						divJobM_Main.appendChild(div);
					}
				}else divJobM_Main.innerHTML="<h3>&nbsp;No job found!</h3>";
				labJobM_Total.innerHTML=res.length;
			})
		}
	}
}