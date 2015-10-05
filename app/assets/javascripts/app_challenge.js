$(document).ready(function(){
	//store the BPI Object
	var bpiList = [];
	var currentPriceEl = document.getElementById("current_price");
	var rollingAverageEl =document.getElementById("rolling_average") ;
	
	var oneMinAgoEl = document.getElementById("oneMinAgo");
	var twoMinAgoEl = document.getElementById("twoMinAgo"); 
	var threeMinAgoEl = document.getElementById("threeMinAgo"); 
	var fourMinAgoEl = document.getElementById("fourMinAgo"); 
	var fiveMinAgoEl = document.getElementById("fiveMinAgo"); 

	var timeLeftEl = document.getElementById("timeLeft"); 

	//Stream Observable, get from the url(API coindesk)
	var requestStream = Rx.Observable.just("http://api.coindesk.com/v1/bpi/currentprice.json");	

	//Stream Observable, making plain object from the promise of Response
	var responseStream = requestStream.flatMap(function(requestUrl){
		return Rx.Observable.fromPromise($.getJSON(requestUrl));
	});

	//this stream will be execute each minute, starting when the page is loaded
	var streamByMinute = Rx.Observable.interval(60000).startWith("startup");

	//subscription 
	streamByMinute.subscribe(function(interval){
		actionResponse();
	});

	//Actions when getting the response
	function actionResponse(){
		//Subscription for responseStream, update the value in current price.
		//and calculate rolling_average, and update table of last five values
		responseStream.subscribe(function(objectBpi){
			streamBySecond();

			var price = objectBpi.bpi.USD.rate;
			//store the attr rate			
			bpiList.push(price);
			
			//Update Text with the Current Value
			updateContent(currentPriceEl, price + "$");			
			console.log(bpiList);
			//Stream from array with the last Five Value
			var streamLastFiveValue = Rx.Observable.fromArray(bpiList);
			var mappedList = getStreamMappedToFloat(streamLastFiveValue);
			
			//Validate if the length of array is greater than 5 then
			updateHistoryPriceList(streamLastFiveValue);
			if(bpiList.length >= 5){
				calculateRollingAverage(mappedList);
			}

			
		});

	}

	function getStreamMappedToFloat(streamListValue){
		return streamListValue.map(function(value){
			return parseFloat(value);
		});		
	}

	function calculateRollingAverage(streamListValue){
		subscriptionAverage = streamListValue.average().subscribe(function(value){
			updateContent(rollingAverageEl, value.toFixed(4) + "$");
			//shift the first element, dont need the value anymore.
			bpiList.shift();			
		});		
		//don't need the subscription anymore
		subscriptionAverage.dispose();
	}

	function updateHistoryPriceList(streamListValue){
		stream = streamListValue.select(function(value, idx, obs){
			return {index: idx, valor: value};
		}).subscribe(function(value){
			udpateDataTableHistory(value.index, value.valor);
			console.log(value);
		});

		stream.dispose();
	}

	function udpateDataTableHistory(idx, value){
		rateHistoricText = value + "$";
		switch(idx){
			case 0:
				oneMinAgoEl.textContent = rateHistoricText;
				break;
			case 1:
				twoMinAgoEl.textContent = rateHistoricText;
				break;
			case 2:
				threeMinAgoEl.textContent = rateHistoricText;
				break;
			case 3:
				fourMinAgoEl.textContent = rateHistoricText;
				break;
			case 4:
				fiveMinAgoEl.textContent = rateHistoricText;
				break;					
			default:
				console.log("default");
				break;
		}
	}

	function streamBySecond(){
		 Rx.Observable.interval(1000).map(
				function(x){
					time = 60 - x;											
					return time;
					}).take(60).subscribe(
				function(timeLeft){
					updateContent(timeLeftEl,"Updating Price in "+ timeLeft + " Seg.")					
		});		
			
	}

	function updateContent(element, text){
		element.textContent = text;
	}
}
);