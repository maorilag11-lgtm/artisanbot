;(function () {
  'use strict'

  const script = document.currentScript || document.querySelector('script[data-artisan]')
  if (!script) return

  const slug = script.getAttribute('data-artisan')
  if (!slug) return

  const APP_URL = script.src.replace('/widget.js', '')

  // Prevent double init
  if (window.__artisanbot_loaded) return
  window.__artisanbot_loaded = true

  // Load config
  fetch(APP_URL + '/api/widget/' + slug + '/config')
    .then(function (r) { return r.json() })
    .then(function (config) { initWidget(config) })
    .catch(function () { initWidget({}) })

  function initWidget(config) {
    const color = config.color || '#2563EB'
    const botName = config.bot_name || 'ArtisanBot'
    const welcomeMsg = config.welcome_message || 'Bonjour 👋 Comment puis-je vous aider ?'

    // Create Shadow DOM host
    const host = document.createElement('div')
    host.id = 'artisanbot-widget-host'
    host.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:Inter,sans-serif;'
    document.body.appendChild(host)

    const shadow = host.attachShadow({ mode: 'open' })

    // Inject Google Fonts into shadow DOM
    const fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
    shadow.appendChild(fontLink)

    // Styles
    const style = document.createElement('style')
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      :host { font-family: 'Inter', sans-serif; }

      #bubble {
        width: 56px; height: 56px; border-radius: 50%;
        background: ${color}; color: white;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: transform 200ms, box-shadow 200ms;
        border: none; outline: none;
      }
      #bubble:hover { transform: scale(1.08); box-shadow: 0 6px 16px rgba(0,0,0,0.3); }

      #panel {
        position: absolute; bottom: 68px; right: 0;
        width: 360px; height: 520px;
        background: white; border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.16);
        display: none; flex-direction: column; overflow: hidden;
        border: 1px solid #E5E7EB;
      }
      #panel.open { display: flex; animation: slideIn 200ms ease-out; }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(12px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      #panel-header {
        background: ${color}; color: white;
        padding: 14px 16px; display: flex; align-items: center; gap: 10px;
        flex-shrink: 0;
      }
      #panel-avatar {
        width: 36px; height: 36px; border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex; align-items: center; justify-content: center; font-size: 16px;
        flex-shrink: 0;
      }
      #panel-title { font-size: 14px; font-weight: 600; }
      #panel-status { font-size: 11px; opacity: 0.85; }
      #close-btn {
        margin-left: auto; background: none; border: none; color: rgba(255,255,255,0.8);
        cursor: pointer; padding: 4px; border-radius: 4px; line-height: 1;
        font-size: 18px;
      }

      #messages {
        flex: 1; overflow-y: auto; padding: 16px;
        display: flex; flex-direction: column; gap: 10px;
        scroll-behavior: smooth;
      }

      .bubble {
        max-width: 82%; padding: 10px 14px; border-radius: 12px;
        font-size: 13px; line-height: 1.55; word-wrap: break-word;
      }
      .bubble-bot {
        background: #F3F4F6; color: #111827;
        border-radius: 12px 12px 12px 2px; align-self: flex-start;
      }
      .bubble-user {
        background: ${color}; color: white;
        border-radius: 12px 12px 2px 12px; align-self: flex-end;
      }

      .typing {
        display: flex; gap: 4px; padding: 12px 14px;
        background: #F3F4F6; border-radius: 12px 12px 12px 2px;
        align-self: flex-start; width: fit-content;
      }
      .dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: #9CA3AF; animation: pulse 1.2s infinite;
      }
      .dot:nth-child(2) { animation-delay: 0.2s; }
      .dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes pulse {
        0%,80%,100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
      }

      #input-area {
        padding: 12px; border-top: 1px solid #E5E7EB;
        display: flex; gap: 8px; align-items: center; flex-shrink: 0;
      }
      #input-text {
        flex: 1; border: 1px solid #E5E7EB; border-radius: 8px;
        padding: 9px 12px; font-size: 13px; outline: none;
        font-family: inherit; color: #111827;
        transition: border-color 150ms;
      }
      #input-text:focus { border-color: ${color}; }
      #send-btn {
        background: ${color}; color: white; border: none;
        border-radius: 8px; padding: 9px 12px; cursor: pointer;
        flex-shrink: 0; transition: opacity 150ms;
        display: flex; align-items: center; justify-content: center;
      }
      #send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      #badge {
        position: absolute; top: -4px; right: -4px;
        width: 18px; height: 18px; border-radius: 50%;
        background: #EF4444; color: white; font-size: 10px; font-weight: 700;
        display: none; align-items: center; justify-content: center;
        border: 2px solid white;
      }
      #badge.show { display: flex; }
    `
    shadow.appendChild(style)

    // Bubble
    const bubbleContainer = document.createElement('div')
    bubbleContainer.style.cssText = 'position:relative;'

    const bubble = document.createElement('button')
    bubble.id = 'bubble'
    bubble.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`
    bubble.setAttribute('aria-label', 'Ouvrir le chat')

    const badge = document.createElement('div')
    badge.id = 'badge'
    badge.textContent = '1'

    bubbleContainer.appendChild(bubble)
    bubbleContainer.appendChild(badge)

    // Panel
    const panel = document.createElement('div')
    panel.id = 'panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', 'Chat avec ' + botName)

    panel.innerHTML = `
      <div id="panel-header">
        <div id="panel-avatar">🔨</div>
        <div>
          <div id="panel-title">${botName}</div>
          <div id="panel-status">● En ligne</div>
        </div>
        <button id="close-btn" aria-label="Fermer">✕</button>
      </div>
      <div id="messages"></div>
      <div id="input-area">
        <input id="input-text" type="text" placeholder="Votre message..." aria-label="Message" />
        <button id="send-btn" aria-label="Envoyer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    `

    shadow.appendChild(panel)
    shadow.appendChild(bubbleContainer)

    // State
    let isOpen = false
    let isTyping = false
    let conversationId = null
    let messageHistory = []

    const messagesEl = panel.querySelector('#messages')
    const inputEl = panel.querySelector('#input-text')
    const sendBtnEl = panel.querySelector('#send-btn')
    const closeBtnEl = panel.querySelector('#close-btn')

    function addMessage(content, role) {
      const div = document.createElement('div')
      div.className = 'bubble bubble-' + (role === 'visitor' ? 'user' : 'bot')
      div.textContent = content
      messagesEl.appendChild(div)
      messagesEl.scrollTop = messagesEl.scrollHeight
    }

    function showTyping() {
      const div = document.createElement('div')
      div.className = 'typing'
      div.id = 'typing-indicator'
      div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>'
      messagesEl.appendChild(div)
      messagesEl.scrollTop = messagesEl.scrollHeight
    }

    function hideTyping() {
      const t = messagesEl.querySelector('#typing-indicator')
      if (t) t.remove()
    }

    async function sendMessage() {
      if (!inputEl) return
      const text = inputEl.value.trim()
      if (!text || isTyping) return

      inputEl.value = ''
      isTyping = true
      if (sendBtnEl) sendBtnEl.disabled = true

      addMessage(text, 'visitor')
      messageHistory.push({ role: 'user', content: text })
      showTyping()

      try {
        const res = await fetch(APP_URL + '/api/widget-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: slug,
            conversation_id: conversationId,
            message: text,
            messages: messageHistory.slice(-10),
          }),
        })

        const data = await res.json()
        hideTyping()

        if (data.conversation_id) conversationId = data.conversation_id
        const reply = data.message || 'Désolé, une erreur est survenue.'
        addMessage(reply, 'assistant')
        messageHistory.push({ role: 'assistant', content: reply })

        if (!isOpen) {
          badge.classList.add('show')
        }
      } catch (e) {
        hideTyping()
        addMessage('Désolé, une erreur de connexion est survenue. Veuillez réessayer.', 'assistant')
      } finally {
        isTyping = false
        if (sendBtnEl) sendBtnEl.disabled = false
        if (inputEl) inputEl.focus()
      }
    }

    // Open/close
    bubble.addEventListener('click', function () {
      isOpen = !isOpen
      if (isOpen) {
        panel.classList.add('open')
        badge.classList.remove('show')
        if (messagesEl.children.length === 0) {
          addMessage(welcomeMsg, 'assistant')
        }
        setTimeout(function () { if (inputEl) inputEl.focus() }, 200)
        bubble.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      } else {
        panel.classList.remove('open')
        bubble.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
      }
    })

    if (closeBtnEl) {
      closeBtnEl.addEventListener('click', function () {
        isOpen = false
        panel.classList.remove('open')
        bubble.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
      })
    }

    if (sendBtnEl) sendBtnEl.addEventListener('click', sendMessage)
    if (inputEl) {
      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
      })
    }
  }
})()
