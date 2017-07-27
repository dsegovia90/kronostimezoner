// const cities = require('../cities')

module.exports = {
    // loopCities: (arr) => {
    //     return arr.map(city => {
    //         return city
    //     })
    // }
    loopCities: (arr) => {
        let citiesArr = []
        for(let i = 0; i < arr.length; i++){
            let cityObj = {"text":arr[i],"value":arr[i]}
            citiesArr.push(cityObj)
        }
        return citiesArr
    }
}