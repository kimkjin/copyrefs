// ==UserScript==
// @name         Script MS - Bobr, MS e Fittingroom (Final V3)
// @namespace    http://tampermonkey.net/
// @version      3.1.0
// @description  Copia IDs das REFs: Bobr (referências), Shopwindow e Fittingroom (IDs das imagens).
// @author       Luan B
// @match        *://bobr.privalia.com/productionreorder/index?id=*
// @match        *://br.privalia.pin/microsites/shopwindow/campaign/*
// @match        *://br.privalia.pin/microsites/fittingroom/campaign/*
// @updateURL    https://raw.githubusercontent.com/kimkjin/copyrefs/main/Script-PO-MS.js
// @downloadURL  https://raw.githubusercontent.com/kimkjin/copyrefs/main/Script-PO-MS.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    let selectedArticles = [];
    let copiedReferences = [];
    let autoSaveTimeout;

    function createTextBox() {
        if (!document.getElementById('copiedText')) {
            const textBox = document.createElement('textarea');
            textBox.id = 'copiedText';
            textBox.style.position = 'fixed';
            textBox.style.top = '150px';
            textBox.style.right = '20px';
            textBox.style.width = '300px';
            textBox.style.height = '300px';
            textBox.style.overflowY = 'auto';
            textBox.style.zIndex = '10000';
            document.body.appendChild(textBox);
            textBox.addEventListener('input', () => {
                if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(saveTextAutomatically, 1000);
            });
        }
    }

    function showPopup(message) {
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '50px';
        popup.style.right = '10px';
        popup.style.padding = '10px';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        popup.style.color = 'white';
        popup.style.zIndex = '10001';
        popup.style.transition = 'opacity 2s';
        popup.innerHTML = message;
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.style.opacity = '0';
            setTimeout(() => document.body.removeChild(popup), 2000);
        }, 3000);
    }

    function saveTextAutomatically() {
        const textBox = document.getElementById('copiedText');
        if (textBox) GM_setValue('copiedText', textBox.value);
    }

    function loadSavedText() {
        const savedText = GM_getValue('copiedText');
        if (savedText) {
            const textBox = document.getElementById('copiedText');
            if (textBox) {
                textBox.value = savedText;
                copiedReferences = savedText.split('\n').map(item => item.trim()).filter(Boolean);
            }
        }
    }

    //  Bobr
    function addClickListenersToArticles() {
        const articles = document.querySelectorAll('article[id^="item-"]');
        articles.forEach(article => {
            article.addEventListener('click', () => {
                selectedArticles.forEach(a => a.classList.remove('selected'));
                selectedArticles = [article];
                article.classList.add('selected');

                const textElement = article.querySelector('.item-reference');
                if (textElement) {
                    const text = textElement.textContent.trim();
                    if (text && !copiedReferences.includes(text)) {
                        const textBox = document.getElementById('copiedText');
                        textBox.value += text + '\n';
                        copiedReferences.push(text);
                        saveTextAutomatically();
                        showPopup('Referência copiada: ' + text);
                    } else {
                        showPopup('Referência já copiada!');
                    }
                }
            });
        });
    }

    function addCopyButtonBobr() {
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Salvar manualmente';
        copyButton.style.position = 'fixed';
        copyButton.style.top = '120px';
        copyButton.style.right = '20px';
        copyButton.addEventListener('click', () => {
            saveTextAutomatically();
            showPopup('Lista salva!');
        });
        document.body.appendChild(copyButton);
    }

    // MS + Pagina do produto
    function addCopyButtonToContainers() {
        const containers = document.querySelectorAll('div.productlist_image.clearfix.rel');
        containers.forEach(container => {
            if (!container.querySelector('.copy-ref-button')) {
                const button = document.createElement('button');
                button.textContent = 'Copiar Referência';
                button.className = 'copy-ref-button';
                Object.assign(button.style, {
                    position: 'absolute',
                    top: '-15px',
                    right: '0px',
                    zIndex: '9999',
                    padding: '4px 8px',
                    backgroundColor: '#000000',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderRadius: '4px'
                });
                container.style.position = 'relative';
                container.appendChild(button);
            }
        });
    }

    function addCopyButtonToVisor() {
        const visor = document.querySelector('#visor');
        if (visor && !visor.querySelector('.copy-ref-button-visor')) {
            const button = document.createElement('button');
            button.textContent = 'Copiar Referência';
            button.className = 'copy-ref-button-visor';
            Object.assign(button.style, {
                position: 'absolute',
                top: '0px',
                right: '0px',
                zIndex: '9999',
                padding: '4px 8px',
                backgroundColor: '#000000',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                borderRadius: '4px'
            });
            visor.style.position = 'relative';
            visor.appendChild(button);
        }
    }

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('copy-ref-button')) {
            event.preventDefault();
            event.stopPropagation();
            const container = event.target.closest('div.productlist_image.clearfix.rel');
            if (container) {
                const img = container.querySelector('img[data-original-src], img[src]');
                if (img) {
                    const src = img.getAttribute('data-original-src') || img.getAttribute('src');
                    const match = src.match(/products_-_(.+?)_-_ab1\.jpg/i);
                    if (match && match[1]) {
                        const refId = match[1];
                        const textBox = document.getElementById('copiedText');
                        if (textBox && !copiedReferences.includes(refId)) {
                            textBox.value += refId + '\n';
                            copiedReferences.push(refId);
                            saveTextAutomatically();
                            showPopup('Referência copiada: ' + refId);
                        } else {
                            showPopup('Referência já copiada!');
                        }
                    } else {
                        showPopup('ID não encontrado!');
                    }
                } else {
                    showPopup('Imagem não encontrada!');
                }
            }
        }

        if (event.target.classList.contains('copy-ref-button-visor')) {
            event.preventDefault();
            event.stopPropagation();
            const images = document.querySelectorAll('#visor img[src]');
            if (images.length > 0) {
                const src = images[0].getAttribute('src');
                const match = src.match(/products_-_(.+?)_-_/i);
                if (match && match[1]) {
                    const refId = match[1];
                    const textBox = document.getElementById('copiedText');
                    if (textBox && !copiedReferences.includes(refId)) {
                        textBox.value += refId + '\n';
                        copiedReferences.push(refId);
                        saveTextAutomatically();
                        showPopup('Referência copiada: ' + refId);
                    } else {
                        showPopup('Referência já copiada!');
                    }
                } else {
                    showPopup('ID não encontrado no visor!');
                }
            } else {
                showPopup('Imagem não encontrada no visor!');
            }
        }
    }, true);

    // start
    createTextBox();
    loadSavedText();

    if (window.location.href.includes('/productionreorder/index')) {
        addClickListenersToArticles();
        addCopyButtonBobr();
        new MutationObserver(() => addClickListenersToArticles()).observe(document.body, { childList: true, subtree: true });
        showPopup('Script Bobr ativado!');
    }

    if (window.location.href.includes('/shopwindow/campaign/') || window.location.href.includes('/fittingroom/campaign/')) {
        setTimeout(() => {
            addCopyButtonToContainers();
            addCopyButtonToVisor();
        }, 1000);
        new MutationObserver(() => {
            addCopyButtonToContainers();
            addCopyButtonToVisor();
        }).observe(document.body, { childList: true, subtree: true });
        showPopup('Script Shopwindow/Fittingroom ativado!');
    }
})();
