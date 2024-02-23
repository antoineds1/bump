import { useContext } from "react";
import { pb } from "../pocketbase";
import AppContext from "../appcontext";

export async function UpdateUser(json){
	const {userInfo} = useContext(AppContext);
	const record = await pb.collection('bumpusers').update('RECORD_ID', json);
}

export function hasReacted(reactions, userId){
	var hasReact = false;
	for(var i=0;i<reactions.length;i++){
		if(reactions[i].fromUser == userId){
			hasReact = true
			break;
		}
	}
	return hasReact;
}
export function sortFriendsByLastbumps(record) {
	record.expand.friends.sort((a, b) => {
	  if (a.expand.lastbumps && b.expand.lastbumps) {
		return new Date(b.expand.lastbumps.created) - new Date(a.expand.lastbumps.created);
	  } else if (a.expand.lastbumps) {
		return -1;
	  } else if (b.expand.lastbumps) {
		return 1;
	  } else {
		return 0;
	  }
	});
  
	return record;
  }