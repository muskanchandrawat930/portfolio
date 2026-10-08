const form=document.querySelector("#searchForm");
const input=document.querySelector("#city"), errorBox=document.querySelector("#error");
const weather=document.querySelector("#weather"), empty=document.querySelector("#empty");
const status=document.querySelector("#status");
const codes={0:["☀️","Clear sky"],1:["🌤️","Mainly clear"],2:["⛅","Partly cloudy"],3:["☁️","Overcast"],45:["🌫️","Fog"],48:["🌫️","Rime fog"],51:["🌦️","Light drizzle"],53:["🌦️","Drizzle"],55:["🌧️","Heavy drizzle"],61:["🌦️","Light rain"],63:["🌧️","Rain"],65:["🌧️","Heavy rain"],71:["🌨️","Light snow"],73:["❄️","Snow"],75:["❄️","Heavy snow"],80:["🌦️","Rain showers"],81:["🌧️","Rain showers"],82:["⛈️","Heavy showers"],95:["⛈️","Thunderstorm"],96:["⛈️","Thunderstorm + hail"],99:["⛈️","Thunderstorm + heavy hail"]};

async function getJSON(url){
  const r=await fetch(url);
  if(!r.ok) throw new Error(`Request failed with HTTP ${r.status}`);
  return r.json();
}
async function findCity(city){
  const q=new URLSearchParams({name:city.trim(),count:"1",language:"en",format:"json"});
  const data=await getJSON(`https://geocoding-api.open-meteo.com/v1/search?${q}`);
  if(!data.results?.length) throw new Error(`No city found for "${city}".`);
  return data.results[0];
}
async function getWeather(lat,lon){
  const q=new URLSearchParams({
    latitude:lat,longitude:lon,
    current:"temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone:"auto",forecast_days:"7"
  });
  return getJSON(`https://api.open-meteo.com/v1/forecast?${q}`);
}
function render(city,data){
  const c=data.current,[icon,desc]=codes[c.weather_code]||["🌡️","Unknown"];
  document.querySelector("#name").textContent=`${city.name}${city.country_code?`, ${city.country_code}`:""}`;
  document.querySelector("#meta").textContent=[city.admin1,city.country].filter(Boolean).join(" • ");
  document.querySelector("#updated").textContent=`Updated ${new Date(c.time).toLocaleString()}`;
  document.querySelector("#temp").textContent=Math.round(c.temperature_2m);
  document.querySelector("#humidity").textContent=Math.round(c.relative_humidity_2m);
  document.querySelector("#wind").textContent=Math.round(c.wind_speed_10m);
  document.querySelector("#condition").textContent=`${icon} ${desc}`;
  const f=document.querySelector("#forecast"); f.innerHTML="";
  data.daily.time.forEach((date,i)=>{
    const d=new Date(`${date}T12:00:00`), label=i===0?"Today":d.toLocaleDateString(undefined,{weekday:"short"});
    const [ico]=codes[data.daily.weather_code[i]]||["🌡️"];
    f.innerHTML+=`<div class="day"><b>${label}</b><div class="icon">${ico}</div><b>${Math.round(data.daily.temperature_2m_max[i])}° / ${Math.round(data.daily.temperature_2m_min[i])}°</b><small>💧 ${data.daily.precipitation_probability_max[i]??0}%</small></div>`;
  });
  document.querySelector("#json").textContent=JSON.stringify({location:city,weather:data},null,2);
  weather.classList.remove("hidden"); empty.classList.add("hidden");
}
async function search(city){
  errorBox.classList.add("hidden"); status.textContent="Loading...";
  try{const location=await findCity(city);const data=await getWeather(location.latitude,location.longitude);render(location,data);status.textContent="Live data loaded";}
  catch(e){console.error(e);errorBox.textContent=e instanceof TypeError?"Network error. Check your internet connection.":e.message;errorBox.classList.remove("hidden");weather.classList.add("hidden");empty.classList.remove("hidden");status.textContent="Request failed";}
}
form.addEventListener("submit",e=>{e.preventDefault();if(input.value.trim())search(input.value)});
window.addEventListener("DOMContentLoaded",()=>search("Indore"));