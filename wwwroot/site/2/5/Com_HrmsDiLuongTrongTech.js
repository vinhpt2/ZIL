var Com_HrmsDiLuongTrongTech={
	run:function(p){
		var now=new Date();
		w2popup.open({
			title: '📜 <i>Đi lương trong Techcombank</i>',
			modal:true,
			width: 360,
			height: 220,
			body: "<table style='margin:auto'><tr><td>Ngày chuyển</td><td><input id='numTinhCong_Day' value='"+now.toISOString().substr(0,10)+"'/></td></tr><tr><td>Lần</td><td><input type='number' id='numLanChuyen' style='width:60px' value='0'/></td></tr><tr><td>Nội dung chuyển</td><td colspan='5'><textarea id='txtNoiDungChuyen'>ORIT chuyển tiền</textarea></td></tr></table>",
			buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Close</button><button class="w2ui-btn" onclick="Com_HrmsDiLuongTrongTech.runReport()">✔️ Report</button>'
		})

	},
	runReport:function(){
		if(numTinhCong_Day.value){
			NUT_DS.select({url:_context.service["hrms"].urledit+"rpt_diluong",where:[["ngaychuyen","=",numTinhCong_Day.value],["lan","=",numLanChuyen.value],["nganhang","=","TECHCOMBANK"]]},function(res){
				if(res.length){
					var win=window.open("client/"+_context.user.clientid+"/"+_context.curApp.applicationid+"/DiLuongTrongTech.html");
					win.onload=function(){
						this.labThangNam.innerHTML=numTinhCong_Day.value+"_"+numLanChuyen.value;
						this.labNgayBaoCao.innerHTML=(new Date()).toLocaleString();
						for(var i=0;i<res.length;i++){
							var rec=res[i];
							var row=this.tblData.insertRow();
							row.innerHTML="<td>"+rec.sotien+"</td><td>"+NUT.loaiBoDau(rec.hoten)+"</td><td align='center'>"+rec.sotaikhoan+"</td><td>"+txtNoiDungChuyen.value+"</td><td>"+rec.sohoso+"</td>";
						}
					}
				} else NUT.tagMsg("No data to report!","yellow");
			});
		} else NUT.tagMsg("Nhập ngày chuyển trước khi thực hiện!","yellow");
	}
}