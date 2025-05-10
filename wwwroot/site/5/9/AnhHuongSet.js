var AnhHuongSet={
	run:function(p){
		if (p.records.length) {
			var li = p.records[0];
			var lyr = NUT.AGMap.view.graphics;
			
			var g = new NUT.AGMap.Graphic({
				geometry: p,
				symbol: {
					type: "simple-fill",
					style: "none",
					outline: { color: "red", width: 1 }
				}
			});
			lyr.add(g);
		}else NUT.tagMsg("No row selected!","yellow");
	}
}