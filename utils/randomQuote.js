/* utils/randomQuote.js */
const QUOTES = [
  { quote: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { quote: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { quote: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
  { quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { quote: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { quote: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { quote: 'Great things never come from comfort zones.', author: 'Unknown' },
  { quote: 'Dream it. Wish it. Do it.', author: 'Unknown' },
  { quote: 'Stay focused and never give up.', author: 'Unknown' },
  { quote: 'Work hard in silence, let success make the noise.', author: 'Unknown' },
  { quote: 'The harder you work for something, the greater you will feel when you achieve it.', author: 'Unknown' },
  { quote: 'Don\'t stop when you\'re tired. Stop when you\'re done.', author: 'KineMan' },
];

const randomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];

module.exports = { randomQuote, QUOTES };