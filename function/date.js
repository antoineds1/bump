export function getFormattedDate(date) {
    let year = date.getFullYear();
    let month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are zero based
    let day = ("0" + date.getDate()).slice(-2);
    return year + "-" + month + "-" + day;
}
export function getLettralTime(timestampUnix) {
    const maintenant = new Date().getTime();
    const tempsEcoule = maintenant - (timestampUnix * 1000); // convertir le timestamp Unix en millisecondes

    const secondes = Math.floor(tempsEcoule / 1000);
    const minutes = Math.floor(secondes / 60);
    const heures = Math.floor(minutes / 60);
    const jours = Math.floor(heures / 24);
    const semaines = Math.floor(jours / 7);
    const mois = Math.floor(jours / 30);
    const annees = Math.floor(mois / 12);

    if (annees > 0) {
        return `${annees} an(s)`;
    } else if (mois > 0) {
        return `${mois} mois`;
    } else if (semaines > 0) {
        return `${semaines} semaine(s)`;
    } else if (jours > 0) {
        return `${jours}j`;
    } else if (heures > 0) {
        return `${heures}h`;
    } else if (minutes > 0) {
        return `${minutes}min`;
    } else {
        return `maintenant`;
    }
}
export function groupBumpsByDate(bumps) {
    let bumpsByDate = {};

    bumps.forEach(bump => {
        let date = new Date(bump.date*1000).toISOString().split('T')[0]; // Get the date in YYYY-MM-DD format
        if (bumpsByDate[date]) {
            bumpsByDate[date].push(bump);
        } else {
            bumpsByDate[date] = [bump];
        }
    });
    // Convert the object to the requested array format
    let bumpsByDateArray = Object.keys(bumpsByDate).map(date => {
        return {
            date: date,
            bumps: bumpsByDate[date].sort(function (a, b) {
                if (a.date > b.date) {
                    return -1;
                }
            })
        };
    });

    return bumpsByDateArray;
}