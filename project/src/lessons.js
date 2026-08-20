import { getLessons, addLesson, updateLesson, deleteLesson, getConcepts } from './storage.js'
import { escapeHtml } from './utils.js'

export function renderLessonsView(container) {
  let editingId = null

  async function render() {
    container.innerHTML = `<p class="empty-state">Yükleniyor…</p>`
    let lessons = []
    let concepts = []
    try {
      ;[lessons, concepts] = await Promise.all([getLessons(), getConcepts()])
    } catch (err) {
      container.innerHTML = `<p class="empty-state">Dersler yüklenemedi. Lütfen tekrar deneyin.</p>`
      return
    }

    container.innerHTML = `
      <section class="panel form-panel">
        <h2>Yeni Ders Ekle</h2>
        <form id="lesson-form" novalidate>
          <label class="field">
            <span>Ders Adı</span>
            <input type="text" id="lesson-name" placeholder="Örn: Tarih, Vatandaşlık, Biyoloji" maxlength="60" />
          </label>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Ders Ekle</button>
          </div>
        </form>
      </section>
      <section class="panel list-panel">
        <div class="list-header">
          <h2>Derslerim</h2>
          <span class="count-badge">${lessons.length}</span>
        </div>
        ${
          lessons.length === 0
            ? `<p class="empty-state">Henüz ders eklemedin. Yukarıdaki formu ile başla.</p>`
            : `<div class="lesson-list">
                ${lessons
                  .map((l) => {
                    const count = concepts.filter((c) => c.lessonId === l.id).length
                    const isEditing = editingId === l.id
                    return `
                      <div class="lesson-item" data-id="${l.id}">
                        ${
                          isEditing
                            ? `<form class="lesson-edit-form" data-id="${l.id}">
                                <input type="text" class="lesson-edit-input" value="${escapeHtml(l.name)}" maxlength="60" />
                                <div class="lesson-edit-actions">
                                  <button type="submit" class="icon-btn lesson-save-btn" title="Kaydet" aria-label="Kaydet">✓</button>
                                  <button type="button" class="icon-btn lesson-cancel-btn" title="İptal" aria-label="İptal">✕</button>
                                </div>
                              </form>`
                            : `<div class="lesson-info">
                                <span class="lesson-name-text">${escapeHtml(l.name)}</span>
                                <span class="lesson-count-badge">${count} kavram</span>
                              </div>
                              <div class="lesson-item-actions">
                                <button class="icon-btn lesson-edit-btn" data-id="${l.id}" title="Düzenle" aria-label="Düzenle">✎</button>
                                <button class="icon-btn lesson-delete-btn" data-id="${l.id}" title="Sil" aria-label="Sil">✕</button>
                              </div>`
                        }
                      </div>
                    `
                  })
                  .join('')}
              </div>`
        }
      </section>
    `

    if (editingId) {
      const input = container.querySelector('.lesson-edit-input')
      if (input) {
        input.focus()
        input.setSelectionRange(input.value.length, input.value.length)
      }
    }

    bindEvents(lessons, concepts)
  }

  function bindEvents(lessons, concepts) {
    container.querySelector('#lesson-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const input = container.querySelector('#lesson-name')
      const name = input.value.trim()
      if (!name) return
      input.disabled = true
      try {
        await addLesson(name)
      } catch (err) {
        input.disabled = false
        alert('Ders eklenemedi. Lütfen tekrar deneyin.')
        return
      }
      input.value = ''
      input.disabled = false
      render()
    })

    container.querySelectorAll('.lesson-edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingId = btn.dataset.id
        render()
      })
    })

    container.querySelectorAll('.lesson-edit-form').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const input = form.querySelector('.lesson-edit-input')
        const name = input.value.trim()
        if (!name) {
          input.focus()
          return
        }
        input.disabled = true
        try {
          await updateLesson(form.dataset.id, name)
        } catch (err) {
          input.disabled = false
          alert('Ders güncellenemedi. Lütfen tekrar deneyin.')
          return
        }
        editingId = null
        render()
      })

      const cancelBtn = form.querySelector('.lesson-cancel-btn')
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          editingId = null
          render()
        })
      }
    })

    container.querySelectorAll('.lesson-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const count = concepts.filter((c) => c.lessonId === btn.dataset.id).length
        const msg =
          count > 0
            ? `Bu ders silinecek. Bu derse ait ${count} kavram derssiz kalacak. Devam etmek istiyor musun?`
            : 'Bu dersi silmek istediğine emin misin?'
        if (confirm(msg)) {
          try {
            await deleteLesson(btn.dataset.id)
          } catch (err) {
            alert('Ders silinemedi. Lütfen tekrar deneyin.')
            return
          }
          if (editingId === btn.dataset.id) editingId = null
          render()
        }
      })
    })
  }

  render()
}
