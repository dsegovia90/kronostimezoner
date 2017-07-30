// const cities = require('../cities')
const moment = require('moment')

module.exports = {
    chooseDates: ()=>{
        let datesArr = []
        let nextDate
        let dateObj ={}
        for(let i = 0; i < 31;i++){
        console.log("TIME:" + moment().add(i, 'days').format('ll'))
        nextDate= moment().add(i, 'days').format('ll')
        dateObj = {"text":nextDate,"value":nextDate}
        datesArr.push(dateObj)
        }
        console.log("DATESARR: " + datesArr)
        return datesArr
    } 
}

