// ==UserScript==
// @name         Copiar Texto para Caixa de Texto com Popup
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  Detecta texto da classe 'item-reference' e permite copiá-lo para uma caixa de texto com um popup informativo
// @author       Luan B,
// @match        *://bobr.privalia.com/productionreorder/index?id=*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    var selectedArticles = [];
    var copiedReferences = [];
    var isDuplicatePopupVisible = false;
    var isAutoSavePopupVisible = false;

    function createTextBox() {
        var textBox = document.createElement('textarea');
        textBox.id = 'copiedText';
        textBox.style.position = 'fixed';
        textBox.style.top = '150px';
        textBox.style.right = '20px';
        textBox.style.width = '300px';
        textBox.style.height = '300px';
        textBox.style.overflowY = 'auto';
        textBox.addEventListener('input', function() {
            if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(function() {
                saveTextAutomatically();
            }, 1000);
        });
        document.body.appendChild(textBox);
    }

    function collectImageLinks() {
        var imageElements = document.querySelectorAll('img[src*="img-br.prvstatic.com/front/get/photo/"]');
        var imageLinks = [];

        if (imageElements) {
            imageElements.forEach(function(image) {
                var imageUrl = image.getAttribute('src');
                imageLinks.push(imageUrl);
            });
        }

        return imageLinks;
    }

    function addImageLinksToTextBox() {
        var textBox = document.getElementById('imageLinks');
        if (textBox) {
            var imageLinks = collectImageLinks();
            imageLinks.forEach(function(link) {
                textBox.value += link + '\n';
            });
        }
    }

    function showPopup(message) {
        var popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '50px';
        popup.style.right = '10px';
        popup.style.padding = '10px';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        popup.style.color = 'white';
        popup.style.zIndex = '9999';
        popup.style.transition = 'opacity 2s';
        popup.innerHTML = message;
        document.body.appendChild(popup);
        setTimeout(function() {
            popup.style.opacity = '0';
            setTimeout(function() {
                document.body.removeChild(popup);
                adjustPopupPosition(); // Chama a função para posicionar a próxima notificação
            }, 2000);
        }, 3000);
    }

    function adjustPopupPosition() {
        var popups = document.querySelectorAll('div[role="popup"]');
        var topOffset = 10;
        for (var i = 0; i < popups.length; i++) {
            popups[i].style.top = topOffset + 'px';
            topOffset += popups[i].offsetHeight + 10; // Aumenta o deslocamento para a próxima notificação
        }
    }

    function addClickListenersToArticles() {
        var articles = document.querySelectorAll('article[id^="item-"]');
        if (articles) {
            articles.forEach(function(article) {
                article.addEventListener('click', function(event) {
                    toggleArticleSelection(article);
                    copySelectedArticles();
                });
            });
        }
    }

    function toggleArticleSelection(article) {
        selectedArticles.forEach(function(selectedArticle) {
            selectedArticle.classList.remove('selected');
        });
        selectedArticles = [article];
        article.classList.add('selected');
    }

    function copySelectedArticles() {
        selectedArticles.forEach(function(selectedArticle) {
            var textElement = selectedArticle.querySelector('.item-reference');
            if (textElement) {
                var text = textElement.textContent.trim();
                if (text && !copiedReferences.includes(text)) {
                    var textBox = document.getElementById('copiedText');
                    textBox.value += text + '\n';
                    copiedReferences.push(text);
                } else {
                    showDuplicatePopup();
                }
            }
        });
        // Atualize o salvamento automático após cada cópia
        saveTextAutomatically();
    }

    function addCopyButton() {
        var copyButton = document.createElement('button');
        copyButton.textContent = 'Salvar manualmente';
        copyButton.style.position = 'fixed';
        copyButton.style.top = '120px';
        copyButton.style.right = '20px';
        copyButton.addEventListener('click', function() {
            saveTextAutomatically();
            showPopup('Lista salva!');
        });
        document.body.appendChild(copyButton);
    }


    function loadSavedText() {
        var savedText = GM_getValue('copiedText');
        if (savedText) {
            var textBox = document.getElementById('copiedText');
            textBox.value = savedText;
            // Carregue as referências copiadas anteriormente
            copiedReferences = savedText.split('\n').map(function(item) {
                return item.trim();
            }).filter(Boolean);
        }
    }

    function saveTextAutomatically() {
        var textBox = document.getElementById('copiedText');
        GM_setValue('copiedText', textBox.value);
        showAutoSavePopup();
    }

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                addClickListenersToArticles();
            }
        });
    });

    var observerConfig = { childList: true, subtree: true };

    createTextBox();
    addClickListenersToArticles();
    addCopyButton();
    loadSavedText();
    showPopup('Script ativado!');

    observer.observe(document.body, observerConfig);

    // Função para exibir o pop-up de referência duplicada apenas uma vez
    function showDuplicatePopup() {
        if (!isDuplicatePopupVisible) {
            showPopup('Referência já copiada');
            isDuplicatePopupVisible = true;
        }
    }

    // Função para exibir o pop-up de salvo automaticamente apenas uma vez após cada cópia
    function showAutoSavePopup() {
        if (!isAutoSavePopupVisible) {
            showPopup('Lista salva!');
            isAutoSavePopupVisible = true;
        }
    }
})();
