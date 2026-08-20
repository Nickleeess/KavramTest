import './src/style.css'
import { renderLessonsView } from './src/lessons.js'
import { renderConceptsView } from './src/concepts.js'
import { renderQuizView } from './src/quiz.js'
import { renderMapView } from './src/map.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="app-shell">
    <header class="app-header">
      <div>
        <h1 class="app-title">Kavram<span>Test</span></h1>
        <p class="app-subtitle">Kavramları öğren, bilgini test et</p>
      </div>
      <nav class="tab-nav">
        <button class="tab-btn active" data-tab="lessons">Dersler</button>
        <button class="tab-btn" data-tab="concepts">Kavramlar</button>
        <button class="tab-btn" data-tab="map">Harita</button>
        <button class="tab-btn" data-tab="quiz">Test</button>
      </nav>
    </header>
    <main class="view-container" id="view-container"></main>
  </div>
`

const viewContainer = document.querySelector('#view-container')
const tabBtns = document.querySelectorAll('.tab-btn')

function showTab(tab) {
  tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.tab === tab))
  viewContainer.innerHTML = ''
  if (tab === 'lessons') renderLessonsView(viewContainer)
  else if (tab === 'concepts') renderConceptsView(viewContainer)
  else if (tab === 'map') renderMapView(viewContainer)
  else if (tab === 'quiz') renderQuizView(viewContainer)
}

tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab))
})

showTab('lessons')
