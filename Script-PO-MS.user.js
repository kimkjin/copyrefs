// ==UserScript==
// @name         Script MS - Bobr, Shopwindow e Fittingroom
// @namespace    http://tampermonkey.net/
// @version      3.3.1
// @description  Copia IDs das REFs: Bobr, Shopwindow e Fittingroom e adiciona as refs em uma lista flutuante.
// @author       Luan B
// @match        *://bobr.privalia.com/productionreorder/index?id=*
// @match        *://br.privalia.pin/microsites/shopwindow/campaign/*
// @match        *://br.privalia.pin/microsites/fittingroom/campaign/*
// @updateURL    https://raw.githubusercontent.com/kimkjin/copyrefs/main/Script-PO-MS.user.js
// @downloadURL  https://raw.githubusercontent.com/kimkjin/copyrefs/main/Script-PO-MS.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    let copiedReferences = new Set();
    let debounceTimer;
    let popupElement;

    function createTextBox() {
        if (!document.getElementById('copiedText')) {
            const textBox = document.createElement('textarea');
            textBox.id = 'copiedText';
            Object.assign(textBox.style, {
                position: 'fixed',
                top: '150px',
                right: '20px',
                width: '300px',
                height: '300px',
                overflowY: 'auto',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#fff',
                color: '#838384',
                fontSize: '14px',
                fontFamily: 'Poppins, sans-serif',
                zIndex: '10000',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            });
            document.body.appendChild(textBox);

            textBox.addEventListener('input', debounceSave);
        }
    }

    function showPopup(message) {
        if (!popupElement) {
            popupElement = document.createElement('div');
            Object.assign(popupElement.style, {
                position: 'fixed',
                top: '50px',
                right: '10px',
                padding: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                zIndex: '10001',
                transition: 'opacity 0.5s ease',
                borderRadius: '4px',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '14px',
                maxWidth: '300px',
                wordBreak: 'break-word',
                opacity: '0'
            });
            document.body.appendChild(popupElement);
        }
        popupElement.textContent = message;
        popupElement.style.opacity = '1';
        clearTimeout(popupElement.hideTimeout);
        popupElement.hideTimeout = setTimeout(() => { popupElement.style.opacity = '0'; }, 2000);
    }

    function debounceSave() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const textBox = document.getElementById('copiedText');
            if (textBox) {
                GM_setValue('copiedText', textBox.value);
            }
        }, 500);
    }

    function saveNow() {
        const textBox = document.getElementById('copiedText');
        if (textBox) GM_setValue('copiedText', textBox.value);
    }

    function loadSavedText() {
        const savedText = GM_getValue('copiedText');
        if (savedText) {
            const textBox = document.getElementById('copiedText');
            if (textBox) {
                textBox.value = savedText;
                copiedReferences = new Set(savedText.split('\n').map(item => item.trim()).filter(Boolean));
            }
        }
    }

    // Bobr
    window.addEventListener('click', function(event) {
        const article = event.target.closest('article[id^="item-"]');
        if (article) {
            const textElement = article.querySelector('.item-reference');
            if (textElement) {
                const text = textElement.textContent.trim();
                if (text && !copiedReferences.has(text)) {
                    const textBox = document.getElementById('copiedText');
                    textBox.value += text + '\n';
                    copiedReferences.add(text);
                    saveNow();
                    showPopup('Referência copiada: ' + text);
                } else {
                    showPopup('Referência já copiada!');
                }
            }
        }
    }, true);

    // Shopwindow + Fittingroom
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
                        if (textBox && !copiedReferences.has(refId)) {
                            textBox.value += refId + '\n';
                            copiedReferences.add(refId);
                            debounceSave();
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
                    if (textBox && !copiedReferences.has(refId)) {
                        textBox.value += refId + '\n';
                        copiedReferences.add(refId);
                        debounceSave();
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

    // Inicialização
    createTextBox();
    loadSavedText();

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
