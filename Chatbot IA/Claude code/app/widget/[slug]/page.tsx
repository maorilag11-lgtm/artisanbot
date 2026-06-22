// This page is loaded inside the widget iframe
// It's a minimal chat UI without the full dashboard layout

import { createServiceClient } from '@/lib/supabase/server'

export default async function WidgetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServiceClient()

  const { data: artisan } = await supabase
    .from('artisans')
    .select('company_name, widget_color, widget_bot_name, widget_welcome_message')
    .eq('public_slug', slug)
    .single()

  const color = artisan?.widget_color || '#2563EB'
  const botName = artisan?.widget_bot_name || 'ArtisanBot'
  const welcomeMessage = artisan?.widget_welcome_message || 'Bonjour 👋 Comment puis-je vous aider ?'
  const companyName = artisan?.company_name || 'Artisan'

  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; height: 100vh; display: flex; flex-direction: column; background: #F7F8FA; }
          #header { background: ${color}; color: white; padding: 14px 16px; display: flex; align-items: center; gap: 10px; }
          #header-avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 16px; }
          #header-info { flex: 1; }
          #header-name { font-size: 14px; font-weight: 600; }
          #header-status { font-size: 11px; opacity: 0.85; }
          #messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
          .bubble { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; word-wrap: break-word; }
          .bubble-bot { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px 12px 12px 2px; color: #111827; align-self: flex-start; }
          .bubble-user { background: ${color}; color: white; border-radius: 12px 12px 2px 12px; align-self: flex-end; }
          #input-area { padding: 12px; border-top: 1px solid #E5E7EB; background: white; display: flex; gap: 8px; }
          #input-text { flex: 1; border: 1px solid #E5E7EB; border-radius: 8px; padding: 9px 12px; font-size: 13px; outline: none; font-family: inherit; }
          #send-btn { background: ${color}; color: white; border: none; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 13px; font-weight: 500; }
          #send-btn:disabled { opacity: 0.6; cursor: not-allowed; }
          .typing { display: flex; gap: 4px; padding: 12px 14px; }
          .dot { width: 6px; height: 6px; border-radius: 50%; background: #9CA3AF; animation: pulse 1.2s infinite; }
          .dot:nth-child(2) { animation-delay: 0.2s; }
          .dot:nth-child(3) { animation-delay: 0.4s; }
          @keyframes pulse { 0%,80%,100% { opacity:0.3; transform:scale(0.8); } 40% { opacity:1; transform:scale(1); } }
        `}</style>
      </head>
      <body>
        <div id="header">
          <div id="header-avatar">🔨</div>
          <div id="header-info">
            <div id="header-name">{botName} — {companyName}</div>
            <div id="header-status">● En ligne</div>
          </div>
        </div>
        <div id="messages">
          <div class="bubble bubble-bot">{welcomeMessage}</div>
        </div>
        <div id="input-area">
          <input id="input-text" type="text" placeholder="Votre message..." />
          <button id="send-btn">Envoyer</button>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          const slug = '${slug}';
          const appUrl = '${process.env.NEXT_PUBLIC_APP_URL}';
          let conversationId = null;
          let messageHistory = [];
          let isTyping = false;

          const messagesEl = document.getElementById('messages');
          const inputEl = document.getElementById('input-text');
          const sendBtn = document.getElementById('send-btn');

          function addMessage(content, role) {
            const div = document.createElement('div');
            div.className = 'bubble bubble-' + (role === 'visitor' ? 'user' : 'bot');
            div.textContent = content;
            messagesEl.appendChild(div);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            return div;
          }

          function showTyping() {
            const div = document.createElement('div');
            div.className = 'bubble bubble-bot typing';
            div.id = 'typing';
            div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
            messagesEl.appendChild(div);
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }

          function hideTyping() {
            const t = document.getElementById('typing');
            if (t) t.remove();
          }

          async function sendMessage() {
            const text = inputEl.value.trim();
            if (!text || isTyping) return;

            inputEl.value = '';
            isTyping = true;
            sendBtn.disabled = true;

            addMessage(text, 'visitor');
            messageHistory.push({ role: 'user', content: text });
            showTyping();

            try {
              const res = await fetch(appUrl + '/api/widget-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  slug,
                  conversation_id: conversationId,
                  message: text,
                  messages: messageHistory.slice(-10),
                }),
              });

              const data = await res.json();
              hideTyping();

              if (data.conversation_id) conversationId = data.conversation_id;
              const reply = data.message || 'Désolé, une erreur est survenue.';
              addMessage(reply, 'assistant');
              messageHistory.push({ role: 'assistant', content: reply });
            } catch (e) {
              hideTyping();
              addMessage('Désolé, une erreur est survenue. Veuillez réessayer.', 'assistant');
            } finally {
              isTyping = false;
              sendBtn.disabled = false;
              inputEl.focus();
            }
          }

          sendBtn.addEventListener('click', sendMessage);
          inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
          });
        ` }} />
      </body>
    </html>
  )
}
