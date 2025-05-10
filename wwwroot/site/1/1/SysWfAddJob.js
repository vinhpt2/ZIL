var SysWfAddJob={
	run:function(p){
		if(p.records.length){
			var record=p.records[0];
			var conf=p.config;
			NUT.ds.select({url:NUT.URL+"wfjobtype",select:"jobtypeid,numdaycomplete,jobstepstart,assignedto,timeunit",where:["tableid","=",conf.tableid]},function(res){
				if(res.length){
					var wf=res[0];
					var now=new Date();
					var milisecs=(wf.timeunit==1?86400000:(wf.timeunit==2?3600000:60000));
					var data={
						jobname:record[conf.columncode],
						jobtypeid:wf.jobtypeid,
						assignedto:wf.assignedto,
						startdate:now,
						duedate:new Date(now.getTime()+wf.numdaycomplete*milisecs),
						ownedby:_context.user.username,
						perccomplete:0,
						windowid:conf.windowid,
						tableid:conf.tableid,
						recordid:record[conf.columnkey],
						priorityid:1,
						jobstatusid:1,
						siteid:_context.user.siteid,
						currentstep:record[jobstepstart]
					}
					if(data.assignedto!=data.ownedby)data.sentfrom=data.ownedby;
					NUT.ds.insert({url:NUT.URL+"wfjob",data:data},function(res){
						if(res.length)NUT.tagMsg("Records inserted.","lime");
					});
				}else NUT.tagMsg("No workflow found!","yellow");
			});
		}else NUT.tagMsg("No Service selected!","yellow");
	}
}