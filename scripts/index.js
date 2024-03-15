// Register a listener for the DOMContentLoaded event. This is triggered when the HTML is loaded and the DOM is constructed.
// We are doing this because the script is loaded in the head of the document, so the DOM is not yet constructed when the script is executed.



document.addEventListener("DOMContentLoaded", (_event) => {
    alert("After DOM has loaded");
    // todo: Add code here that updates the HTML, registers event listeners, calls HTTP endpoints, etc.
/* 
	The addressAutocomplete takes as parameters:
  - a container element (div)
  - callback to notify about address selection
  - geocoder options:
  	 - placeholder - placeholder text for an input element
     - type - location type
*/
let selectedCity;
let favoriteList;

/* SECTION #1
  –––––––––––––––––––––––––––––––––––––––––––––––––– 
  Ofera sugestii pe baza a ce introduc la tastatura
  iar cand apas click autocompleteaza */


function addressAutocomplete(containerElement, callback, options) {
  // create input element
  var inputElement = document.createElement("input");
  inputElement.setAttribute("type", "text");
  inputElement.setAttribute("placeholder", options.placeholder);
  containerElement.appendChild(inputElement);

  // add input field clear button
  var clearButton = document.createElement("div");
  clearButton.classList.add("clear-button");
  addIcon(clearButton);
  clearButton.addEventListener("click", (e) => {
    e.stopPropagation();
    inputElement.value = '';
    callback(null);
    clearButton.classList.remove("visible");
    closeDropDownList();
  });
  containerElement.appendChild(clearButton);

/* SECTION #2
  –––––––––––––––––––––––––––––––––––––––––––––––––– 
    Dupa ce apas pe locul unde scriu apare lista oraselor favorite
    care dispare dupa ce introduc orice tasta de la tastatura sau cand
    apas in alt loc*/
  

  function showFavoriteCitiesList() {
    // Check if the favorite list is already displayed
    if (!favoriteList) {
      // Retrieve favorite cities from storage or any other source
      const favorites = getFavorites();
  
      // Create and display a list of favorite cities
      favoriteList = document.createElement('div');
      favoriteList.classList.add('favorite-list');
  
      favorites.forEach(city => {
        const listItem = document.createElement('div');
        listItem.textContent = city;
  
        // Add a click event listener to each listItem
        listItem.addEventListener('click', function () {
          // Get the text content of the clicked element
          const selectedCity = this.textContent;
  
          // Log or use the selected city
          console.log('Selected City:', selectedCity);
  
          // You can perform additional actions here if needed
  
          // Set the selected city in localStorage
          localStorage.setItem("selectedCity", selectedCity);
          
          // Trigger the form submit event (assuming you have a form in your HTML)
          
        });
  
        // You can add more styling or interaction for each favorite city in the list
        favoriteList.appendChild(listItem);
      });
  
      // Append the favorite list to the container element
      containerElement.appendChild(favoriteList);
    }
  }
  
  function hideFavoriteCitiesList() {
    // Check if the favorite list is displayed
    if (favoriteList) {
      // Remove the favorite list from the container
      containerElement.removeChild(favoriteList);
      favoriteList = null; // Reset the reference
    }
  }
  
  document.addEventListener("click", function (event) {
    // Check if the input field is empty
    if (inputElement.value.trim() === '') {
      // Display the list of favorite cities
      showFavoriteCitiesList();
    }
  });
  
  document.addEventListener("click", function (event) {
    // Check if the click target is outside the input box and the favorite list
    if (!inputElement.contains(event.target)) {
      // Hide the favorite list
      hideFavoriteCitiesList();
    }
  });
  
  document.addEventListener("keydown", function (event) {
    // Check if any key is pressed and hide the favorite list
    hideFavoriteCitiesList();
  });
 
  

  
  /* Current autocomplete items data (GeoJSON.Feature) */
  var currentItems;

  /* Active request promise reject function. To be able to cancel the promise when a new request comes */
  var currentPromiseReject;

  /* Focused item in the autocomplete list. This variable is used to navigate with buttons */
  var focusedItemIndex;

  /* Execute a function when someone writes in the text field: */
  inputElement.addEventListener("input", function(e) {
    var currentValue = this.value;
    
    /* Close any already open dropdown list */
    closeDropDownList();
    
    // Cancel previous request promise
    if (currentPromiseReject) {
      currentPromiseReject({
        canceled: true
      });
    }

    if (!currentValue) {
      clearButton.classList.remove("visible");
      return false;
    }

    // Show clearButton when there is a text
    clearButton.classList.add("visible");

    /* Create a new promise and send geocoding request */
    var promise = new Promise((resolve, reject) => {
      currentPromiseReject = reject;

      var apiKey = "84f6e6abf11b4bc480f75930bc2a11be";
      var url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(currentValue)}&limit=5&apiKey=${apiKey}`;
      if (options.type) {
      	url += `&type=${options.type}`;
      }

      fetch(url)
        .then(response => {
          // check if the call was successful
          if (response.ok) {
            response.json().then(data => resolve(data));
          } else {
            response.json().then(data => reject(data));
          }
        });
    });

    promise.then((data) => {
      currentItems = data.features;

      /*create a DIV element that will contain the items (values):*/
      var autocompleteItemsElement = document.createElement("div");
      autocompleteItemsElement.setAttribute("class", "autocomplete-items");
      containerElement.appendChild(autocompleteItemsElement);

      /* For each item in the results */
      data.features.forEach((feature, index) => {
        /* Create a DIV element for each element: */
        var itemElement = document.createElement("DIV");
        /* Set formatted address as item value */
        itemElement.innerHTML = `${feature.properties.city}, ${feature.properties.country}`;

        /* Set the value for the autocomplete text field and notify: */
        itemElement.addEventListener("click", function(e) {
          inputElement.value =`${currentItems[index].properties.city}, ${currentItems[index].properties.country}`;

          callback(currentItems[index]);

          /* Close the list of autocompleted values: */
          closeDropDownList();
        });

        autocompleteItemsElement.appendChild(itemElement);
      });
    }, (err) => {
      if (!err.canceled) {
        console.log(err);
      }
    });
  });


  /* Add support for keyboard navigation */
  inputElement.addEventListener("keydown", function(e) {
    var autocompleteItemsElement = containerElement.querySelector(".autocomplete-items");
    if (autocompleteItemsElement) {
      var itemElements = autocompleteItemsElement.getElementsByTagName("div");
      if (e.keyCode == 40) {
        e.preventDefault();
        /*If the arrow DOWN key is pressed, increase the focusedItemIndex variable:*/
        focusedItemIndex = focusedItemIndex !== itemElements.length - 1 ? focusedItemIndex + 1 : 0;
        /*and and make the current item more visible:*/
        setActive(itemElements, focusedItemIndex);
      } else if (e.keyCode == 38) {
        e.preventDefault();

        /*If the arrow UP key is pressed, decrease the focusedItemIndex variable:*/
        focusedItemIndex = focusedItemIndex !== 0 ? focusedItemIndex - 1 : focusedItemIndex = (itemElements.length - 1);
        /*and and make the current item more visible:*/
        setActive(itemElements, focusedItemIndex);
      } else if (e.keyCode == 13) {
        /* If the ENTER key is pressed and value as selected, close the list*/
        e.preventDefault();
        if (focusedItemIndex > -1) {
          closeDropDownList();
        }
      }
    } else {
      if (e.keyCode == 40) {
        /* Open dropdown list again */
        var event = document.createEvent('Event');
        event.initEvent('input', true, true);
        inputElement.dispatchEvent(event);
      }
    }
  });

  function setActive(items, index) {
    if (!items || !items.length) return false;

    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove("autocomplete-active");
    }

    /* Add class "autocomplete-active" to the active element*/
    items[index].classList.add("autocomplete-active");

    // Change input value and notify
    inputElement.value = `${currentItems[index].properties.city}, ${currentItems[index].properties.country}`;
    callback(currentItems[index]);
  }

  function closeDropDownList() {
    var autocompleteItemsElement = containerElement.querySelector(".autocomplete-items");
    if (autocompleteItemsElement) {
      containerElement.removeChild(autocompleteItemsElement);
    }

    focusedItemIndex = -1;
  }

  function addIcon(buttonElement) {
    var svgElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    svgElement.setAttribute('viewBox', "0 0 24 24");
    svgElement.setAttribute('height', "24");

    var iconElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    iconElement.setAttribute("d", "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z");
    iconElement.setAttribute('fill', 'currentColor');
    svgElement.appendChild(iconElement);
    buttonElement.appendChild(svgElement);
  }
  
    /* Close the autocomplete dropdown when the document is clicked. 
  	Skip, when a user clicks on the input field */
  document.addEventListener("click", function(e) {
    if (e.target !== inputElement) {
      closeDropDownList();
    } else if (!containerElement.querySelector(".autocomplete-items")) {
      // open dropdown list again
      var event = document.createEvent('Event');
      event.initEvent('input', true, true);
      inputElement.dispatchEvent(event);
    }
  });

}

addressAutocomplete(document.getElementById("autocomplete-container-city"), (data) => {
  console.log("Selected city: ");
  console.log(data);
}, {
	placeholder: "Enter a city name here",
  type: "city"
});


/* SECTION #3
  –––––––––––––––––––––––––––––––––––––––––––––––––– 
  Api Key pentru pozele de background si la fiecare card in functie de vreme*/

const pexelsApiKey = "2sbdm4QbzmABcO3b2b2NgxVf2YAskU0EGfd4lwFv0GV1xjVxnKx92wPA";
const apiKey = "4d8fb5b93d4af21d66a2948710284366";

// Function to get a random photo URL from Pexels for a given city
async function getPexelsPhoto(city) {
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${city}&per_page=1`, {
      headers: {
        Authorization: pexelsApiKey,
      },
    });

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large; // You can choose a different size if needed
    }

    return null;
  } catch (error) {
    console.error("Error fetching Pexels photo:", error);
    return null;
  }
}

// loc de declarat variabile pe care sa le folosesc ulterior
const h1Element = document.querySelector('h1');
const form = document.querySelector(".top-banner form");
const input = document.querySelector(".top-banner input");
const msg = document.querySelector(".top-banner .msg");
const list = document.querySelector(".ajax-section .cities");
const loadingSpinner = document.querySelector(".loading-spinner"); // Reference to the loading spinner


form.addEventListener("click", async (e) => {
  e.preventDefault();
  loadingSpinner.style.display = "block";

  const cat = localStorage.getItem("selectedCity");
  let inputVal = cat;
  localStorage.removeItem("selectedCity");
  
if(!inputVal){
  inputVal = input.value;
}
 
  // Clear previous error message
  msg.textContent = "";


  // Remove all existing city cards
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }




  /* SECTION #4
  –––––––––––––––––––––––––––––––––––––––––––––––––– 
  Creeare container pentru a adauga orasele din lista de favorite*/

  const container = document.querySelector('h2');

  const cityContainer = document.createElement("div");
  cityContainer.classList.add("city-container");
  

  
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // Assuming button1 is your heart button
  const heartButton = onNewCitySearch(inputVal);
  
  const cityNameElement = document.createElement("h2");
  cityNameElement.classList.add("city-name");
  cityNameElement.dataset.name = inputVal;
  cityNameElement.innerHTML = `<span>${inputVal}</span>`;
  
  cityContainer.appendChild(cityNameElement);
  
  // Append the heart button to the city container
  if (heartButton) {
    cityContainer.appendChild(heartButton);
  }
  
  // Now, you can append the entire city container to your city list
  container.appendChild(cityContainer);






/* SECTION #5
  –––––––––––––––––––––––––––––––––––––––––––––––––– 
  Api Key pentru vreme*/

  // Fetch weather forecast data for the next 5 days
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${inputVal}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Check if data.list exists
    if (data.list && data.list.length > 0) {
      // Fetch background image from Pexels
      const backgroundImg = await getPexelsPhoto(inputVal);

      // Set the background properties of the body or another container
      document.body.style.backgroundImage = `url('${backgroundImg}')`;
      document.body.style.backgroundRepeat = "no-repeat"; // Set the background to not repeat
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundPosition = "0px 0px";

      

      // Filter out redundant entries and select only one entry per day
      const filteredData = data.list.filter((entry, index, array) => {
        const date = new Date(entry.dt_txt).toLocaleDateString();
        const nextEntry = array[index + 1];
        const nextDate = nextEntry ? new Date(nextEntry.dt_txt).toLocaleDateString() : null;
        return date !== nextDate;
      });

      // Loop through the filtered forecast entries
      // Assuming you have retrieved the weather data in a variable called 'filteredData'


// Create an array to store promises
const photoPromises = filteredData.slice(0, 6).map(async (dayForecast) => {
  const { main, weather, dt_txt } = dayForecast;

  // Use await to get the photo URL based on weather description
  const photoUrl = await getPexelsPhoto(weather[0].description);

  // Return an object with data needed for rendering
  return {
    cityName: inputVal,
    dayOfWeek: new Date(dt_txt).toLocaleDateString(undefined, { weekday: 'long' }),
    dateOfCity: new Date(dt_txt).toLocaleDateString('en-GB'),
    temperature: Math.round(main.temp),
    iconUrl: `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`,
    description: weather[0].description,
    photoUrl,
    humidity: main.humidity,
  };
});

// Wait for all promises to resolve
const forecastData = await Promise.all(photoPromises);


/* SECTION #6
  –––––––––––––––––––––––––––––––––––––––––––––––––– 
  Crearea de carduri pentru fiecare zi pentru 5 zile*/


// Loop through the resolved data and render the list
forecastData.forEach((data) => {
  const li = document.createElement("li");
  li.classList.add("city");

  // Set background image on the right side
  if (data.photoUrl) {
    li.style.setProperty('--background-image', `url(${data.photoUrl})`);
  }

  const markup = `
    <h2 class="city-name" data-name="${data.cityName}">
      <span>${data.dayOfWeek}</span>
    </h2>
    <h2 class="city-name" data-name="${data.cityName}">
      <sup>${data.dateOfCity}</sup>
    </h2>
    <div class="city-temp">${data.temperature}<sup>°C</sup></div>
    <div class="city-description">${data.description}</div>
    <figure>
      <img class="city-icon" src="${data.iconUrl}" alt="${data.description}">
    </figure>
  `;


  // Set gradient background for the cards
  const gradientColor = getGradientColor(data.description);
  li.style.background = gradientColor;

  li.innerHTML = markup;

  
  // Append the new card to the list
  list.appendChild(li);
});

      
    } else {
      // Handle case where forecast data is not available
      msg.style.display = "block";
     // Background picture gets small when i want to go to home or change the city
     // It gets big again in the code above where i set the backgroundPosition to 0px 0px
      document.body.style.backgroundPosition = "-9999px -9999px";
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  } catch (error) {
    // Background picture gets small when i want to go to home or change the city
     // It gets big again in the code above where i set the backgroundPosition to 0px 0px
    document.body.style.backgroundPosition = "-9999px -9999px";
    // Display error message
    msg.textContent = "Please search for a valid city 😩";
  }  finally {
    // Hide the loading spinner after fetch operation is complete
    loadingSpinner.style.display = "none";
  }


   // Am facut ca tiltlul, "Weather App" sa poata sa fie apasat
   // si sa stearga toate chestiile care ar fi putut aparea
  h1Element.addEventListener('click', () => {
    document.body.style.backgroundPosition = "-9999px -9999px";
    while (list.firstChild) {
      list.removeChild(list.firstChild);
      
      clearHeartButtons();
    }
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    if (msg) {
      msg.style.display = "none";
  }
  });

  // Reset the form and focus on the input
  form.reset();
  input.focus();
});



});

/* SECTION #7
  –––––––––––––––––––––––––––––––––––––––––––––––––– 
  Functii pentru culoarea gradient in interiorul cardurilor specific vremii*/

function getGradientColor(weatherDescription) {
  switch (weatherDescription.toLowerCase()) {
    case 'clear sky':
      return 'linear-gradient(to bottom, #ffcc00, #ff6600)'; // Yellow to orange gradient for clear skies
    case 'overcast clouds':
      return 'linear-gradient(to bottom, #b3b3b3, #999999)'; // Gray gradient for overcast clouds
    case 'scattered clouds':
      return 'linear-gradient(to bottom, #b3b3b3, #999999)'; // Gray gradient for scattered clouds
    case 'few clouds':
      return 'linear-gradient(to bottom, #b3b3b3, #999999)'; // Gray gradient for few clouds
    case 'light rain':
      return 'linear-gradient(to bottom, #3399ff, #0066cc)'; // Blue gradient for light rain
    case 'snow':
      return 'linear-gradient(to bottom, #ffffff, #cccccc)'; // White gradient for snow
    case 'broken clouds':
      return 'linear-gradient(to bottom, #b3b3b3, #999999)'; // Gray gradient for broken clouds
    case 'light snow':
      return 'linear-gradient(to bottom, #ffffff, #cccccc)'; // White gradient for light snow
    case 'moderate rain':
      return 'linear-gradient(to bottom, #3399ff, #0066cc)'; // Blue gradient for moderate rain
    // Add more cases for other weather conditions
    default:
      return 'linear-gradient(to bottom, #f0f0f0, #d9d9d9)'; // Default gradient
  }
}



/* SECTION #8
  –––––––––––––––––––––––––––––––––––––––––––––––––– 
  Functii pentru butonul de favorite-inimioara*/


const createdHeartButtons = new Set();

function createHeartButton(cityName) {
  if (createdHeartButtons.has(cityName)) {
    return null; // Return null if the button is already created for this city
  }

  const button = document.createElement("button");
  button.innerHTML = "♥"; // Heart symbol
  button.className = "favorite-button";
  button.onclick = function () {
    toggleFavorite(this, cityName);
  };

  // Check if the city is already a favorite
  if (isCityInFavorites(cityName)) {
    button.classList.add('favorite');
  }

  createdHeartButtons.add(cityName); // Add the city to the set

  return button;
}

// Function to clear all heart buttons
function clearHeartButtons() {
  createdHeartButtons.clear();
  const existingButtons = document.querySelectorAll(".favorite-button");
  existingButtons.forEach(button => button.remove());
}

// Example of how to use this function when a new city is searched
function onNewCitySearch(cityName) {
  clearHeartButtons();
  const heartButton = createHeartButton(cityName);

  return heartButton;
}

// Function to toggle the favorite status of a city
function toggleFavorite(button, cityName) {
  const isFavorite = isCityInFavorites(cityName);

  if (isFavorite) {
    removeFromFavorites(cityName);
    button.classList.remove('favorite');
  } else {
    addToFavorites(cityName);
    button.classList.add('favorite');
  }
}

// Function to check if a city is in the favorites list
function isCityInFavorites(cityName) {
  const favorites = getFavorites(); // Retrieve favorites from storage
  return favorites.includes(cityName);
}

// Function to add a city to the favorites list
function addToFavorites(cityName) {
  const favorites = getFavorites(); // Retrieve favorites from storage
  favorites.push(cityName);
  saveFavorites(favorites); // Save updated favorites to storage
}

// Function to remove a city from the favorites list
function removeFromFavorites(cityName) {
  let favorites = getFavorites(); // Retrieve favorites from storage
  favorites = favorites.filter(city => city !== cityName);
  saveFavorites(favorites); // Save updated favorites to storage
}

// Function to retrieve favorites from storage
function getFavorites() {
  // Use LocalStorage or any other storage mechanism you prefer
  // Return an array of favorite city names
  const storedFavorites = localStorage.getItem('favorites');
  return storedFavorites ? JSON.parse(storedFavorites) : [];
}

// Function to save favorites to storage
function saveFavorites(favorites) {
  // Use LocalStorage or any other storage mechanism you prefer
  // Save the array of favorite city names
  localStorage.setItem('favorites', JSON.stringify(favorites));
}




