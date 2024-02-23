export function listUniqueActivities(record) {
    let activitySet = [];
    let activitesStories = [];
    record.bumps.reverse().forEach(bump => {
        if (bump.activity && bump.activity.trim() !== "") {
            if(!activitySet.includes(bump.activity)){
                activitySet.push(bump.activity);
                activitesStories.push({image:"https://fitfeat.xyz/api/files/9sjagr7u7qz4p8x/"+bump.id+"/"+bump.photo, text:bump.activity, id:bump.id})
            }
        }
    });

    return activitesStories;
}
export function getDates(data) {
	try{
		return data.map(item => item.date);
	}catch(e){
		return []
	}
}

export function listUniqueLocalisation(record) {

    const bumpArray = record.bumps
    // Create an object that stores unique locations
    const uniqueLocations = {};

    const bumpsWithUniqueLocation = bumpArray.reduce((acc, bump) => {
        const widget = bump.widgets.find(w => ["Localisation", "Ville"].includes(w.name));
        // If the location exists and hasn't been recorded yet
        if (widget && !uniqueLocations[widget.value]) {
            uniqueLocations[widget.value] = true;

            // Push a new object with the required fields to the accumulator
            acc.push({
                image: "https://fitfeat.xyz/api/files/9sjagr7u7qz4p8x/"+bump.id+"/"+bump.photo,
                text: widget.value,
                id: bump.id,
            });
        }

        return acc;
    }, []);

    return bumpsWithUniqueLocation;
}

export function listUniqueSports(record) {

    const bumpArray = record.bumps
    // Create an object that stores unique locations
    const uniqueSport = {};

    const bumpsWithUniqueLocation = bumpArray.reduce((acc, bump) => { 
        const widget = bump.widgets.find(w => ["Nombre de pas"].includes(w.name));

        // If the location exists and hasn't been recorded yet
        if (widget && !uniqueSport[widget.name]) {
            uniqueSport[widget.name] = true;

            // Push a new object with the required fields to the accumulator
            acc.push({
                image: "https://fitfeat.xyz/api/files/9sjagr7u7qz4p8x/"+bump.id+"/"+bump.photo,
                text: widget.name,
                id: bump.id,
            });
        }

        return acc;
    }, []);

    return bumpsWithUniqueLocation;
}

export function listUniqueWithUsers(record) {
    const bumpArray = record.bumps
    // Create an object that stores unique users
    const uniqueUsers = {};

    const uniqueWithUsers = bumpArray.reduce((acc, bump) => {
        if(bump.expand.with) {
            bump.expand.with.forEach(user => {
                // If the user exists and hasn't been recorded yet
                if(user && !uniqueUsers[user.id]) {
                    uniqueUsers[user.id] = true;

                    // Push a new object with the required fields to the accumulator
                    acc.push({
                        image: "https://fitfeat.xyz/api/files/swe3s17d84b6w6r/"+user.id+"/"+user.profilPicture,
                        text: user.username,
                        id: user.id,
                    });
                }
            });
        }

        return acc;
    }, []);

    return uniqueWithUsers;
}

export function filterBump(id, bumps, value){
    const otp = [];
    if(id == 0){
        bumps.map((item, _)=>{
            if(item['activity'] == value)
                otp.push(item)
        })
    }
    if(id == 1){
        bumps.map((item, _)=>{
            item.widgets.map((widget, _)=>{
                if(widget.value == value){
                    if(!otp.includes(item))
                        otp.push(item)
                }
            })
        })
    }
    if (id == 2){
        bumps.map((item, _)=>{
            item.widgets.map((widget, _)=>{
                if(widget.name == value){
                    if(!otp.includes(item))
                        otp.push(item)
                }
            })
        })
    }
    if(id == 3){
        bumps.map((item, _)=>{
           if(item.expand.with){
                item.expand.with.map((user, _)=>{
                    if(user.username == value)
                        otp.push(item)
                })
           }
        })
    }

    return otp
}