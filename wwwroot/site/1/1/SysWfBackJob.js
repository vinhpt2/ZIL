var SysWfBackJob={
	run:function(p){
		if(p.records.length){
			this.job=p.records[0];
			var sentfrom=this.job.sentfrom;
			NUT.ds.select({url:NUT.URL+"wfjobtype",select:"users",where:["jobtypeid","=",this.job.jobtypeid]},function(res){
				if(res.length){
					var users=res[0].users.split(",");
					var str='<select id="cboJob_User" disabled>';
					for(var i=0;i<users.length;i++)
						str+=(users[i]==sentfrom?'<option selected>':'<option>')+users[i]+'</option>';

					w2popup.open({
						speed:0,
						width:400,
						height:200,
						title:"Back job",
						body: '<table style="margin:auto"><tr><td><label for="radJob_Back">Give back</label><input id="radJob_Back" type="radio" checked name="grpJob_0" onchange="cboJob_User.disabled=this.checked"/></td><td><label for="radJob_Forward">Forward to</label><input id="radJob_Forward" type="radio" name="grpJob_0" onchange="cboJob_User.disabled=!this.checked"/></td></tr><tr><td>To user</td><td>'+str+'</select></td></tr><tr><td>Note</td><td><textarea id="txtJob_Note"></textarea></td></tr></table>',
						buttons: '<button class="w2ui-btn" onclick="w2popup.close()">Cancel</button><button class="w2ui-btn" onclick="Com_SysWfBackJob.updateJob()">Ok</button>'
					});
				}
			});
			
		}else NUT.tagMsg("No Job selected!","yellow");
	},
	updateJob(){
		NUT.ds.update({url:NUT.URL+"wfjob",where:["jobid","=",this.job.jobid],data:{sentfrom:_context.user.username,assignedto:cboJob_User.value,assignstatusid:null,note:txtJob_Note.value}},function(res){
			NUT.tagMsg("Job sent.","lime");
		});
	}
}