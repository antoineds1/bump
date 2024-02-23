export function isAlreadyThisWidget(widget, widgetList){
	let isIn = false;
	for(var i=0;i<widgetList.length;i++){
		if(widget.name == widgetList[i].name){
			isIn = true;
			break;
		}
	}
	return isIn
}