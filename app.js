'use strict';

process.env.DEBUG = 'actions-on-google:*';

let ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
let express = require('express');
let bodyParser = require('body-parser');
let fetch = require('node-fetch');

let app = express();
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

const API_KEY = process.env.API_KEY;
const API_HOST_AND_PATH = 'https://api.themoviedb.org/3/discover/movie'
const API_PARAMS = `api_key=${API_KEY}&include_adult=false&include_video=false`;

const GENRES = [{"id":28,"name":"Action"},{"id":12,"name":"Adventure"},{"id":16,"name":"Animation"},{"id":35,"name":"Comedy"},{"id":80,"name":"Crime"},{"id":99,"name":"Documentary"},{"id":18,"name":"Drama"},{"id":10751,"name":"Family"},{"id":14,"name":"Fantasy"},{"id":36,"name":"History"},{"id":27,"name":"Horror"},{"id":10402,"name":"Music"},{"id":9648,"name":"Mystery"},{"id":10749,"name":"Romance"},{"id":878,"name":"Science Fiction"},{"id":53,"name":"Thriller"},{"id":10752,"name":"War"},{"id":37,"name":"Western"}];

const DEFAULT_FALLBACK_ACTION = 'input.unknown';
const WELCOME_ACTION = 'welcome';
const ASK_GENRE_ACTION = 'ask_genre';
const GET_MOVIE_ACTION = 'get_movie';
const AVAILABLE_GENRES_ACTION = 'available_genres';
const QUIT_ACTION = 'quit';

function lookupGenreIds(genre) {
  let foundGenres = GENRES.filter(function(genre) {
    return this.genre.includes(genre['name']) ;
  }, { genre: genre });

  return foundGenres.map(function(genre) {
    return genre['id'];
  });
}

function apiUrl(genreIds) {
  return `${API_HOST_AND_PATH}?${API_PARAMS}&with_genres=${genreIds.join(',')}`;
}

function currentGenres(assistant) {
  let genreArg = assistant.getArgument('genre') || [];
  let genre = genreArg.length > 0 ? genreArg : assistant.data.last_genre;
  assistant.data.last_genre = genre;
  return genre;
}

function getMovie(assistant) {
  let genres = currentGenres(assistant);
  let genreIds = lookupGenreIds(genres);

  if (genreIds.length === 0) {
    assistant.ask("I don't know that genre. Try a different one.");
    return;
  }

  fetch(apiUrl(genreIds))
    .then(function(res) {
        return res.json();
    })
    .then(function(res) {
      return randomMovie(res['results']);
    })
    .then(function(title) {
      assistant.ask(`How about ${title}? Would you like another suggestion?`);
    });
}

function randomMovie(movies) {
  let titles = movies.map(function(movie) {
    return movie['title'];
  });
  return titles[Math.floor(Math.random() * titles.length)];
}

function randomGenres() {
  let titles = movies.map(function(movie) {
    return movie['title'];
  });
  return titles[Math.floor(Math.random() * titles.length)];
}


function quit(assistant) {
  assistant.tell('Ok, see you later.');
}

function defaultFallback(assistant) {
  assistant.ask("Sorry, I didn't understand you. Say a genre to get a movie suggestion.");
}

function askGenre(assistant) {
    assistant.ask("What genre would you like?")
}

function welcome(assistant) {
    assistant.ask("Hi, I'm Movie Maven. Let's find a movie. What genre?");
}

function availableGenres(assistant) {
  assistant.ask('A few available genres are Action, Comedy, Drama, Horror, and Romance.');
}

function actionMap() {
  let actionMap = new Map();

  actionMap.set(DEFAULT_FALLBACK_ACTION, defaultFallback);
  actionMap.set(WELCOME_ACTION, welcome);
  actionMap.set(ASK_GENRE_ACTION, askGenre);
  actionMap.set(GET_MOVIE_ACTION, getMovie);
  actionMap.set(AVAILABLE_GENRES_ACTION, availableGenres);
  actionMap.set(QUIT_ACTION, quit);

  return actionMap;
}

app.post('/', function (request, response) {
  console.log('headers: ' + JSON.stringify(request.headers));
  console.log('body: ' + JSON.stringify(request.body));
  const assistant = new ApiAiAssistant({request: request, response: response});
  assistant.handleRequest(actionMap());
});

var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
