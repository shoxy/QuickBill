
var isConciergePage = window.location.pathname === '/concierge';
if (isConciergePage) {
    $('.nav-item').each(function (index, item) {
        if (index !== 0) {
            $(item).hide();
        }
    });
    $('.side-column').first().hide();
    $('body').css('flex-direction', 'row-reverse');
    $('#graphs-container').hide();
    $('#concierge-page__side-column').show();
    $('#js-users-list-button').hide();
    $('#js-invoice-button').hide();
}

var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

var userObject = eval('('+$("#userObject").text()+')' );
var userId = '{{userId | safe}}';
if (isConciergePage) {
    userId = userObject.nickname;
}

var iframe = document.getElementById('invoice-generator');

$('#user-nickname').text(userObject.nickname);
var $avatar = $('#avatar');
if (isConciergePage) {
    $('#user-id').text('GUEST');
}
$avatar.attr('data-src', userObject.profile_pic);
var channels = [];
var $lastMessage = null;
var $portfolioData = $('#portfolioData');
var portfolioData = eval($portfolioData.text());
$portfolioData.remove();

var scrollHandler = function () {
    shouldUseInverseMode = false;
    if ($(this).scrollTop() === 0 && ($(this).prop('scrollHeight') > $(window).height())) {
        $lastMessage = $('#' + channelId + '>div:visible').first();
        shouldUseInverseMode = true;
        var $loader = $('.messages-loader').first().clone();
        $loader.insertBefore($lastMessage);
        $loader.show();
        channelQueries[channelId].load(loadMessages);
    }
};

var apiPostMessageUrl = isConciergePage ? '/postjson' : '/postjson';
var isOldTitle = true;
var oldTitle = $(document).find("title").text();
var oldFavicon = $('#favicon').attr('href');
var newTitle = 'New message received';
var newFavicon = 'notification.png';
var jsChatColumn = $('#js-chat-column');
var interval = null;
var modal = $('#myModal');

if (isConciergePage) {
    portfolioData = eval($('#conciergeChannels').text());
}

var channelId = portfolioData[0].channelId;
var channelIdFromQuery = new URLSearchParams(window.location.search).get('channelId');
var cookieValue = Cookies.get('channelId');
if (cookieValue !== undefined && !isConciergePage) {
    channelId = cookieValue;
}
if (channelIdFromQuery) {
    channelId = channelIdFromQuery;
}
window.channelId = channelId;
iframe.contentWindow.location.reload();

var hiddenContainers = [];

if (!isConciergePage) {
    renderPortfolios(portfolioData);
} else {
    renderConciergeMessagesContainer();
}

function renderConciergeMessagesContainer() {
    var $messagesContainer = $('<div></div>');
    $messagesContainer.attr('class', 'messages');
    $messagesContainer.attr('id', channelId);
    $messagesContainer.prependTo(jsChatColumn);
    $messagesContainer.on('scroll', scrollHandler);
}

function renderPortfolios(portfolioData) {
    for (var i in portfolioData) {
        var portfolioChannelId = portfolioData[i].channelId;
        var $messagesContainer = $('<div></div>');
        $messagesContainer.attr('class', 'messages');
        $messagesContainer.attr('id', portfolioChannelId);
        if (portfolioChannelId !== channelId) {
            hiddenContainers[portfolioChannelId] = $messagesContainer;
        } else {
            $messagesContainer.on('scroll', scrollHandler);
            $messagesContainer.prependTo(jsChatColumn);
        }

        var thumbSrc = portfolioData[i].thumb;
        var selectorBtnContainer = $("<div class='portfolio-selector__container'>" +
            "<img class='portfolio-selector__thumb js-portfolio-image' src='" + thumbSrc + "' alt='thumb'>" +
            "<input type='file' class='js-portfolio-image-input hidden'>"+
            "<img class='portfolio-selector__thumb js-sync-button' src='/static/img/sync.png'>" +
            "<button class='portfolio-selector btn btn-default'></button><i class='fas fa-check checked-portfolio'></i>" +
            "<div class='channel-info'><div class='channel-info__author'>Author</div>: " +
            "<div class='channel-info__message'><span class='chanel-info__message-body'>message</span>" +
            "<span class='channel-info__date'>1/1/2019</span></div>" +
            "</div>");
        var $selectorBtn = selectorBtnContainer.find('.portfolio-selector');
        var portfolioName = portfolioData[i].portfolio_name;
        var syncButton = selectorBtnContainer.find('.js-sync-button');
        $('.js-portfolio-image').attr('data-channelId', portfolioChannelId);
        $('.js-portfolio-image-input').attr('data-channelId', portfolioChannelId);
        selectorBtnContainer.find('.channel-info__author').first().text(portfolioData[i].channelData.last_msg_user);
        var lastMsgText = portfolioData[i].channelData.last_msg;
        if (lastMsgText.charAt(0) === '{') {
            lastMsgText = 'message';
        }
        if (lastMsgText.length > 20) {
            lastMsgText = lastMsgText.substring(0, 20) + '...';
        }
        selectorBtnContainer.find('.chanel-info__message-body').first().text(lastMsgText);
        selectorBtnContainer.find('.channel-info__date').first().text(portfolioData[i].channelData.last_msg_created_at);
        var btnText = "<span class='portfolio-selector__text'>" + portfolioData[i].portfolio_name + "</span>";
        var messagesCount = portfolioData[i].channelData.unread_messages_count;
        if (portfolioChannelId !== channelId && messagesCount > 0) {
            btnText = "<span class='portfolio-selector__text'>" + portfolioData[i].portfolio_name + "</span>"
                + "<span class='badge badge-pill badge-primary'>" + messagesCount + "</span>";
        }
        $selectorBtn.html(btnText);
        $selectorBtn.attr('data-channelId', portfolioChannelId);
        $selectorBtn.attr('data-portfolioName', portfolioName);
        syncButton.attr('data-channelId', portfolioChannelId);
        if (portfolioChannelId === channelId) {
            selectorBtnContainer.find('.checked-portfolio').first().css('display', 'inline-block');
        }

        selectorBtnContainer.insertBefore('#load-more-button');
    }
}

var displayedDocs = [];
var graphIdPortfolioNameMapping = [];

var graphsCounter = 0;

function renderGraphsFromJson(json) {
    var graphsContainer = $('#graphs-container').first();
    var width = graphsContainer.width();
    var height = (graphsContainer.height() / 2) - 30;
    var graphsData = JSON.parse(json);
    for (var j in graphsData) {
        var graphDiv = $('<div></div>');
        var id = 'graph-' + graphsCounter;
        graphsCounter++;
        graphDiv.attr('id', id);
        graphDiv.appendTo($('#graphs'));
        var graphData = graphsData[j];
        if (!graphData) {
            continue;
        }
        var layout = graphData.layout;
        var type = "";
        if (graphData.data[0] !== undefined) {
            type = '' + graphData.data[0].type;
        }
        var isPie = type == 'pie';
        layout.width = width;
        layout.height = height;
        var title = graphData.layout.title;
        graphData.layout.title = sanitizeName(graphData.layout.title);
        if (isPie) {
            graphData.data[0].domain.x[1] = 1;
        }
        if (parseInt(j) === 2 || parseInt(j) === 3) {
            $('#' + id).detach().appendTo('#graphs-2');
        }
        layout.align = 'center';
        Plotly.plot(
            id, // the ID of the div, created above
            graphData.data,
            layout
        );
        graphIdPortfolioNameMapping['#' + id] = title;
    }
}

function initDocs() {
    $('.doc-content').each(function (index, item) {
        var filesInfo = JSON.parse($(item).text().replace(/'/g, '"'));
        renderChannelFiles(filesInfo);
        $(item).remove();
    });
    var empty = $('#file-container--empty');
    if (displayedDocs.length === 0) {
        empty.removeClass('hidden');
    } else {
        empty.addClass('hidden');
    }
}

function renderChannelFiles(filesInfo) {
    var filesChannelId = Object.keys(filesInfo)[0];
    var files = filesInfo[filesChannelId];
    for (var i in files) {
        renderDoc(filesChannelId, files[i].name, files[i].posted_by, files[i].created_date, files[i].url, files[i].thumb, false);
    }
}

function renderDoc(filesChannelId, filename, postedBy, createdDate, url, thumbImage, shouldPrepend) {
    var container = $('.file-container.hidden').first().clone();
    container.removeClass('hidden');
    if (filesChannelId != channelId) {
        container.hide();
    } else {
        displayedDocs.push(container);
    }
    container.find('.file-description__filename').first().text(filename);
    container.find('.file-description__text').first().text('By: ' + postedBy + ', on ' + createdDate);
    container.find('.file-description__link').first().attr('href', url);
    var thumb = container.find('.file-preview');
    var $img = $('<img/>');
    $img.attr('data-src', thumbImage);
    $img.appendTo(thumb);
    $img.addClass('lozad');

    container.attr('data-channelId', filesChannelId);
    var $docs = $('#docs');
    if (shouldPrepend) {
        container.insertAfter($('#search-bar'));
    } else {
        $docs.append(container);
    }
}

$(document).on('click', '.file-data', function () {
    var link = $(this).find('.file-description__link').first().attr('href');
    var win = window.open(link, '_blank');
    win.focus();
});

initDocs();
initSendBird(true);

$(document).on('click', '.portfolio-selector', function () {
    $(this).find('.badge').first().hide();
    channelId = $(this).attr('data-channelId');
    getPortfolioData();
    window.channelId = channelId;
    iframe.contentWindow.location.reload();
    Cookies.set('channelId', channelId);
    $('#search-input').val('');
    for (var index in graphIdPortfolioNameMapping) {
        var graphContainer = $(index.toString());
        if ($.trim(graphContainer.attr('data-portfolioName')) === $.trim($(this).find('.portfolio-selector__text').first().text())) {
            graphContainer.show();
        } else {
            graphContainer.hide();
        }
    }
    $('.messages').each(function (index, item) {
        hiddenContainers[$(item).attr('id')] = $(item);
        $(item).remove();
    });
    var x = hiddenContainers[channelId];
    x.prependTo(jsChatColumn);
    x.on('scroll', scrollHandler);
    $messagesContainer = $('#' + channelId);
    $messagesContainer.show();
    $('.checked-portfolio').css('display', 'none');
    $(this).next('.checked-portfolio').css('display', 'inline-block');

    var files = $('.file-container');
    var visibleFiles = 0;
    displayedDocs = [];
    files.each(function (index, item) {
        var $item = $(item);
        if ($item.attr('data-channelId') != undefined) {
            if ($item.attr('data-channelId') != channelId) {
                $item.hide();
            } else {
                $item.show();
                displayedDocs.push($item);
                visibleFiles++;
            }
        }
    });
    var empty = $('#file-container--empty');
    if (visibleFiles === 0) {
        empty.removeClass('hidden');
    } else {
        empty.addClass('hidden');
    }
    window.dispatchEvent(new Event('resize'));
    var data = {
        userId: userId,
        channelId: channelId
    };
    $('.js-loading').hide();
    $.post('mark_read', JSON.stringify(data));
    scrollChatToBottom();
    var observer = lozad();
    observer.observe();
});

$(window).on('resize', function () {
    var $downloadApps = $('.download-apps').first();
    if ($(window).width() < 700 || mobileCheck()) {
        $('.js-column').each(function (index, item) {
            $(item).hide();
        });
        $downloadApps.show();
        return;
    } else {
        $('.js-column').each(function (index, item) {
            if (isConciergePage && ($(item).attr('id') === 'graphs-container') || $(item).hasClass('side-column')) {
                return;
            }
            $(item).css('display', 'flex');
        });
        $downloadApps.hide();
    }
    var container = $('#graphs-container');
    var width = container.width();
    var height = (container.height() / 2) - 30;

    container.find('.js-plotly-plot').each(function (index, item) {
        if (!$(item).is(':hidden')) {
            Plotly.relayout($(item).attr('id'), {
                width: width,
                height: height,
                align: 'center'
            });
        }
    });

});

$("#search-input").on('input propertychange', function (event) {
    var filterValue = $(event.target).val().toString().toUpperCase();
    for (var i in displayedDocs) {
        var $item = displayedDocs[i];
        if ($item.find('.file-description__filename').first().text().toUpperCase().indexOf(filterValue) > -1) {
            $item.show();
        } else {
            $item.hide();
        }
    }
});

function sanitizeName(name) {
    if (name === undefined) {
        return '';
    }
    name = name.toString();
    if (name.indexOf('_') === -1) {
        return name;
    }
    return name.substring(0, name.indexOf('_'));
}

var sendBirdWasInitialized = false;
var messageForOptions;
var shouldUseInverseMode = false;

var channelQueries = [];
var channelsCount = 0;

function initSendBird(shouldAddChannelHandlers) {
    var appId = isConciergePage ? '9A997118-6C53-4FA2-AEAA-C335293220B2' : '9A997118-6C53-4FA2-AEAA-C335293220B2';
    var sb = new SendBird({ appId: appId });
    if (isConciergePage) {
        sb.connect(userId, function (user, error) {
            if (error) {
                console.error(error);
                return;
            }
        });
    } else {
        sb.connect(userId, userObject.sbToken, function (user, error) {
            if (error) {
                console.error(error);
                return;
            }
        });
    }

    if (shouldAddChannelHandlers) {
        var ChannelHandler = new sb.ChannelHandler();

        ChannelHandler.onMessageReceived = function (channel, message) {
            var $typingIndicatorSelector = $('.js-loading');
            $typingIndicatorSelector.each(function (index, item) {
                if ($(item).attr('data-userId') == message.sender.userId) {
                    $(item).hide();
                }
            });
            var channelButton = $('button[data-channelid="' + channel.url +'"]');
            var unreadMessageCount = parseInt(channel.unreadMessageCount);
            var senderNickname = channel.lastMessage.sender ? channel.lastMessage.sender.nickname : 'admin';
            if (unreadMessageCount > 1 && channel.url != channelId) {
                var buttonBadge = channelButton.find('.badge-pill');
                if (!buttonBadge.length) {
                    var btnText = "<span class='badge badge-pill badge-primary'>" + unreadMessageCount + "</span>";
                    channelButton.append(btnText);
                } else {
                    buttonBadge.text(channel.unreadMessageCount);
                }
                buttonBadge.show();
                var lastMessageText = channel.lastMessage.message;
                if (lastMessageText.charAt(0) === '{') {
                    lastMessageText = 'message';
                }
                if (lastMessageText.length > 20) {
                    lastMessageText = lastMessageText.substring(0, 20) + '...';
                }
                channelButton.siblings().find('.channel-info__author').text(senderNickname);
                channelButton.siblings().find('.chanel-info__message-body').text(lastMessageText);
                channelButton.siblings().find('.channel-info__date').text(new Date(channel.lastMessage.createdAt).toGMTString());
            }
            if (message.data.length > 0 && JSON.parse(message.data.replace(/'/g, '"')).isOptionsMessage == true) {
                messageForOptions = message;
                return;
            }
            shouldUseInverseMode = false;
            parseMessage(message, messageForOptions, null, true);
            messageForOptions = null;
            scrollChatToBottom();
            newTitle = 'New message from ' + senderNickname;
            if (!document.hasFocus() && !interval) {
                interval = setInterval(changeTitle, 700);
            }
            var audio = new Audio('/static/audio/ring.mp3');
            audio.play();
        };

        ChannelHandler.onTypingStatusUpdated = function (groupChannel) {
            var typingMembers = groupChannel.getTypingMembers();
            if (typingMembers.length === 0) {
                $('.js-loading').each(function (index, item) {
                    $(item).hide();
                });
                return;
            }
            shouldUseInverseMode = false;
            for (var i in typingMembers) {
                var shouldDisplay = true;
                var $typingIndicatorSelector = $('.js-loading');
                $typingIndicatorSelector.each(function (index, item) {
                    if ($(item).attr('data-userId') == typingMembers[i].userId && !$(item).is(':hidden')) {
                        shouldDisplay = false;
                    }
                });

                if (shouldDisplay) {
                    var $message = $typingIndicatorSelector.last().clone();
                    $message.find('.user-avatar').first().attr('src', typingMembers[i].profileUrl);
                    $message.attr('data-userId', typingMembers[i].userId);
                    addMessageToChatColumn($message, groupChannel.url);
                    if (groupChannel.url == channelId && shouldDisplay) {
                        scrollChatToBottom();
                    }
                }
            }
        };
        ChannelHandler.onUserJoined = function(groupChannel, user) {
            window.location.reload(true);
        };
        sb.addChannelHandler(uuidv4(), ChannelHandler);
    }

    var channelListQuery = sb.GroupChannel.createMyGroupChannelListQuery();
    channelListQuery.includeEmpty = true;
    channelListQuery.limit = 20; // pagination limit could be set up to 100

    if (channelListQuery.hasNext) {
        channelListQuery.next(function (channelList, error) {
            if (error) {
                console.error(error);
            }
            channelsCount = channelList.length;
            for (var i in channelList) {
                var groupChannel = channelList[i];
                channels[groupChannel.url] = groupChannel;
                var prevMessageListQuery = groupChannel.createPreviousMessageListQuery();
                prevMessageListQuery.limit = 40;
                prevMessageListQuery.reverse = true;
                prevMessageListQuery.load(loadMessages);
                channelQueries[groupChannel.url] = prevMessageListQuery;
            }
        });
    }
}

var channelsProcessed = 0;
var optionMessageWithoutText = null;

function loadMessages(messages, error) {
    if (error) {
        $('.messages-loader').hide();
        console.error(error);
        return;
    }
    if (!messages || messages.length <= 0) {
        $('.messages-loader').hide();
        return;
    }

    function compare(a, b) {
        if (a.createdAt < b.createdAt)
            return -1;
        if (a.createdAt > b.createdAt)
            return 1;
        return 0;
    }

    if (!sendBirdWasInitialized) {
        // sorting by date
        messages.sort(compare);
    }
    shouldUseInverseMode = sendBirdWasInitialized;

    $('.js-loading').each(function (index, item) {
        $(item).hide();
    });
    if (messages[0].customType === 'url_preview') {
        optionMessageWithoutText = messages[0];
        channelQueries[channelId].load(loadMessages);
        messages[0] = null;
    }
    for (var j in messages) {
        var index = parseInt(j);
        if (messages[index] === null) {
            continue;
        }
        parseMessage(messages[index], messages[index - 1], messages[index + 1]);
    }
    $('.messages-loader').hide();
    channelsProcessed++;
    if (sendBirdWasInitialized && $lastMessage) {
        $messagesContainer.animate({
            scrollTop: $lastMessage.offset().top
        }, 0);
    }
    if (channelsProcessed >= channelsCount && !sendBirdWasInitialized) {
        setTimeout(function () {
            scrollChatToBottom();
        }, 500);
        sendBirdWasInitialized = true;
    }
}

// var userNickname = 'split101';
var chatColumn = $('.chat-column').find('.messages').each(function (index, item) {
    $('.js-loading').first().clone().show().appendTo($(item));
});

var renderedDates = [];

function getReplies(messageObject) {
    try {
        var parsed = JSON.parse(messageObject.message);
        var replies = parsed.replies;
        var questionId = parsed.questionId;
    } catch (e) {
        try {
            var decoded = window.atob(messageObject.message); // trying to parse b64 from it
            replies = decoded.replies;
            questionId = decoded.questionId;
        } catch (e) {
            console.error('Error during parsing message with type url_preview, message text: ' + messageObject.message);
        }
    }
    return [replies, questionId];
}

function parseMessage(messageObject, prevMessageObject, nextMessageObject, shouldAddFile) {
    $('.select').first().hide();
    $('.js-chat-input').show();
    var date = new Date(messageObject.createdAt);
    var messageGroupDate = date.getDate() + ' ' + months[date.getMonth()];
    var channelUrl = messageObject.channelUrl;
    var index = (channelUrl + messageGroupDate).replace(/ /g, "_");
    if (renderedDates[index] === undefined || (renderedDates[index] > messageObject.createdAt)) {
        $('#' + index).hide();
        renderedDates[index] = messageObject.createdAt;
        var dateContainer = $('#js-date-container').clone();
        dateContainer.text(messageGroupDate);
        dateContainer.attr('id', index);
        addMessageToChatColumn(dateContainer, channelUrl);
    }

    switch (messageObject.customType) {
        case 'url_preview' :
            var res = getReplies(messageObject);
            var questionId = res[1];
            var replies = res[0];
            var message = '';
            if (prevMessageObject) {
                message = prevMessageObject.message;
            }
            renderMessage(messageObject, message, replies, questionId);
            break;
        case 'url_preview_cards':
            var cards = null;
            // XXX for some reason message could contain actual json which is not parseable because it has u' at the start
            if (messageObject.message[0] == '{') {
                var m = '' + messageObject.message;
                m = m.replace(/u'/g, '\'');
                m = m.replace(/'/g, '"');
                cards = JSON.parse(m);
            } else {
                try {
                    cards = window.atob(messageObject.message); // trying to parse b64 from it
                } catch (e) {
                    console.error('Cards data couldnt be parsed from message, message: ' + messageObject.message);
                }
            }
            renderCards(cards, messageObject);
            break;
        case '':
            if (messageObject.messageType == 'file') {
                if (shouldAddFile) {
                    try {
                        var fileData = JSON.parse(messageObject.data.replace(/'/g, '"'));
                        renderUploadedFile(fileData.file_path, fileData.thumb_path);
                        break;
                    } catch (e) {
                        renderImage(messageObject, messageObject.url);
                        break;
                    }
                }
                if (messageObject.name.slice(messageObject.name.indexOf('.') + 1) === 'pdf') {
                    var fileData = JSON.parse(messageObject.data.replace(/'/g, '"'));
                    renderImage(messageObject, fileData.file_path);
                } else {
                    renderImage(messageObject, messageObject.url);
                }
                break;
            }
            if (isUserMessage(messageObject)) {
                renderMessage(messageObject, messageObject.message);
                break;
            }
            // to prevent duplicates (plain message and same with options)
            if (nextMessageObject && nextMessageObject.customType != 'url_preview' && !optionMessageWithoutText) {
                renderMessage(messageObject, messageObject.message);
                break;
            }
            if (!isUserMessage(messageObject) && (!nextMessageObject || nextMessageObject.customType == '')) {
                renderMessage(messageObject, messageObject.message);
            }
            break;
        case 'url_preview_input_string':
        case 'url_preview_input_int':
        case 'url_preview_multiple_inputs':
            var parsed = JSON.parse(messageObject.message);
            renderMessage(messageObject, parsed.input, null, parsed.questionId);
            break;
        case 'url_preview_list':
            renderSelect(messageObject);
            break;
        default:
            console.error('unknown message type', messageObject.customType);
            break;
    }
    $('.js-loading').each(function (index, item) {
        $(item).hide();
    });
    var observer = lozad();
    observer.observe();
}

function renderSelect(messageObject) {
    $('.list-select').remove();
    $('.select').remove();
    var parsed = messageObject.message.replace(/'/g, '"');
    parsed = JSON.parse(parsed);
    var options = parsed.list;
    var select = $('<select></select>');
    var id = uuidv4();
    select.attr('id', id);
    select.attr('class', 'list-select');
    select.attr('data-questionId', parsed.questionId);
    for (var i in options) {
        select.append(new Option(options[i].text, options[i].input));
    }
    select.insertAfter($('.attach-container'));
    select.each(selectInit);
    $('.js-chat-input').hide();
    $('.select').first().show();
}

function renderImage(messageObject, filePath) {
    var imageUrl = messageObject.url;
    var sentAtAsString = getSentAtAsString(new Date(messageObject.createdAt));
    var $messageContainer = null;
    if (isUserMessage(messageObject)) {
        $messageContainer = $('.user-message').first();
        if (isConciergePage) {
            $messageContainer.addClass('user-message--concierge');
        }
    } else {
        $messageContainer = $('.responder-message-container').not('.user-message').first();
    }
    var $avatar = $messageContainer.find('.user-avatar').first();
    $avatar.attr('src', getProfileUrl(messageObject));
    var senderData = getNickname(messageObject) + ', ' + sentAtAsString;
    $messageContainer = $messageContainer.clone();
    var $messageTextField = $messageContainer.find('.js-message-text').first();
    $messageContainer.find('.js-sent-at').first().text(senderData);
    var image = $('<img/>').attr('data-src', imageUrl);
    image.attr('data-file-url', filePath);
    image.css('width', '100%');
    image.css('height', '100%');
    image.appendTo($messageTextField);
    image.addClass('text-image');
    image.addClass('lozad');
    $messageTextField.addClass('image-message');
    addMessageToChatColumn($messageContainer, messageObject.channelUrl);
}

function renderMessage(messageObject, messageText, replies, questionId) {
    var $messageContainer = null;
    var senderData = null;
    var sentAtAsString = getSentAtAsString(new Date(messageObject.createdAt));
    if (isUserMessage(messageObject)) {
        $messageContainer = $('.user-message').first();
        var $avatar = $messageContainer.find('.user-avatar').first();
        if (isConciergePage) {
            $avatar.remove();
        } else {
            $avatar.attr('src', getProfileUrl(messageObject));
        }
        senderData = getNickname(messageObject) + ', ' + sentAtAsString;
        if (isConciergePage) {
            $messageContainer.addClass('user-message--concierge');
        }
    } else {
        $messageContainer = $('.responder-message-container').not('.user-message').first();
        var $avatar = $messageContainer.find('.user-avatar').first();
        $avatar.attr('src', getProfileUrl(messageObject));
        senderData = getNickname(messageObject) + ', ' + sentAtAsString;
    }
    $messageContainer = $messageContainer.clone();
    var $messageTextField = $messageContainer.find('.js-message-text').first();
    if (!isUserMessage(messageObject)) {
        messageText = urlify(messageText);
    }
    $messageTextField.html(messageText);
    $messageContainer.find('.js-sent-at').first().text(senderData);
    if (replies) {
        for (var i in replies) {
            var $buttonSample = $messageContainer.find('.option-button').first();
            var $button = $buttonSample.clone();
            var text = replies[i].reply.replace('\u0092', "'");
            $button.html(text);
            $button.attr('data-questionId', questionId);
            $button.attr('data-userId', userId);
            $button.show();
            $button.insertAfter($messageTextField);
        }
    }
    if (messageHasInput(messageObject)) {
        var $input = $messageContainer.find('.js-message-input').first().clone();
        $input.attr('data-questionId', questionId);
        $input.show().insertAfter($messageTextField);
    }
    if (isAdminMessage(messageObject)) {
        $messageContainer.addClass('admin-message');
        $messageTextField.parent().addClass('text--admin-message');
        $messageTextField.prepend('<i class="fab fa-android admin-message__android-icon"></i>');
    }
    addMessageToChatColumn($messageContainer, messageObject.channelUrl);
}

var $messagesContainer = $('#' + channelId).first();

function scrollChatToBottom() {
    var x = $('#' + channelId).first();
    var lastElement = x.find('.js-chat-message').last().get(0);
    var offset = lastElement ? lastElement.offsetTop : 100;
    x.animate({
        scrollTop: offset
    }, 250);
}

$(document).on('click', '.option-button', function () {
    scrollChatToBottom();
    var questionId = $(this).attr('data-questionId');
    var reply = $(this).text();
    var data = {
        userId: userId,
        msg: {
            replies: reply,
            questionId: questionId
        },
        channelId: channelId
    };

    if (!$(this).hasClass('payment-button')) {
        $('.js-loading').first().clone().show().appendTo(chatColumn);
    }

    $.post(apiPostMessageUrl, JSON.stringify(data))
        .always(function () {

        });
});

var offsetInPixels = 328;

function renderCards(cardsObject, messageObject) {
    var $cardsContainer = $('.js-cards-container').first().clone();
    $cardsContainer.find('.user-avatar').first().attr('src', getProfileUrl(messageObject));
    var cardsData = cardsObject.cards;
    if (cardsData.length === 1) {
        $cardsContainer.find('.gallery-switcher').each(function (index, item) {
            $(item).hide();
        })
    }
    for (var i in cardsData) {
        var $galleryItem = $cardsContainer.find('.gallery-item').first().clone();
        var $gallery = $cardsContainer.find('.gallery').first();
        $galleryItem.find('img').first().attr('data-src', cardsData[i].url_image);
        $galleryItem.find('.js-message-text').first().text(cardsData[i].text);
        var $textContainer = $galleryItem.find('.js-text-container').first();
        for (var j in cardsData[i].buttons) {
            var $buttonSample = $galleryItem.find('.option-button').first().clone();
            $buttonSample.text(cardsData[i].buttons[j].text);
            if (cardsData[i].buttons[j].type && cardsData[i].buttons[j].type === 'payment') {
                $buttonSample.addClass('payment-button');
                $buttonSample.attr('data-amount', parseFloat(cardsData[i].buttons[j].data.amount));
                $buttonSample.attr('data-description', cardsData[i].buttons[j].data.description);
            }
            $buttonSample.show();
            $buttonSample.appendTo($textContainer);
        }
        var index = parseInt(i);
        if (index !== 0) {
            $galleryItem.css('position', 'absolute');
            $galleryItem.css('left', (i * offsetInPixels) + 'px');
            $galleryItem.css('top', '8px');
            $galleryItem.removeClass('gallery-item--selected');
        } else {
            $galleryItem.addClass('gallery-item--selected');
        }
        $galleryItem.show();
        $galleryItem.appendTo($gallery);
    }
    $cardsContainer.show();
    var sentAtAsString = getSentAtAsString(new Date(messageObject.createdAt));
    var senderData = getNickname(messageObject) + ', ' + sentAtAsString;
    $cardsContainer.find('.js-sent-at').first().text(senderData);
    addMessageToChatColumn($cardsContainer, messageObject.channelUrl);
}

function getSentAtAsString(date) {
    var hours = date.getHours();
    if (hours < 10) {
        hours = '0' + hours;
    }
    var minutes = date.getMinutes();
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    return hours + ':' + minutes;
}

$(document).on('click', '.gallery-switcher--right', function () {
    var currentlyDisplayedCard = $(this).parent().find('.gallery-item--selected').first();
    // XXX -1 here because parent div contains sample element which is needed for initial rendering, bad hack, but still
    var elementIndex = currentlyDisplayedCard.index() - 2;
    var nextCard = currentlyDisplayedCard.next('.gallery-item').first();
    var offset = offsetInPixels * elementIndex;
    currentlyDisplayedCard.css('transform', 'translate(-' + offset + 'px, 0px)');
    currentlyDisplayedCard.nextAll().each(function (index, item) {
        var offset = offsetInPixels * elementIndex;
        $(item).css('transform', 'translate(-' + offset + 'px, 0px)');
    });

    currentlyDisplayedCard.removeClass('gallery-item--selected');
    nextCard.addClass('gallery-item--selected');
    hideButtonsIfNeeded($(this).parent());
});

$(document).on('click', '.gallery-switcher--left', function () {
    var currentlyDisplayedCard = $(this).parent().find('.gallery-item--selected').first();
    // // XXX -3 here because parent div contains sample element which is needed for initial rendering, bad hack, but still
    var prevCard = currentlyDisplayedCard.prev('.gallery-item');
    var elementIndex = prevCard.index() - 3;
    var offset = offsetInPixels * elementIndex;
    $('.gallery-item').each(function (index, item) {
        $(item).css('transform', 'translate(-' + offset + 'px, 0px)');
    });
    currentlyDisplayedCard.removeClass('gallery-item--selected');
    prevCard.addClass('gallery-item--selected');
    hideButtonsIfNeeded($(this).parent());
});

function hideButtonsIfNeeded(element) {
    var currentlyDisplayedCard = element.find('.gallery-item--selected').first();
    var rightSwitcher = element.find('.gallery-switcher--right').first();
    var leftSwitcher = element.find('.gallery-switcher--left').first();
    if (currentlyDisplayedCard.siblings('.gallery-item').length == currentlyDisplayedCard.index() - 2) {
        rightSwitcher.hide();
    } else {
        rightSwitcher.show();
    }
    if (currentlyDisplayedCard.index() == 3) {
        leftSwitcher.hide();
    } else {
        leftSwitcher.show();
    }
}

function isUserMessage(messageObject) {
    if (!messageObject.sender) {
        return false;
    }
    return messageObject.sender.userId == userId;
}

$(document).on('keyup', '.js-message-input', function (event) {
    var text = $(this).val();
    if (event.keyCode !== 13 || text.length === 0) {
        return;
    }
    var data = {
        userId: userId,
        msg: {
            replies: $(this).val(),
            questionId: $(this).attr('data-questionId'),
        },
        channelId: channelId
    };
    $('.js-loading').first().clone().show().appendTo(chatColumn);
    scrollChatToBottom();
    $.post(apiPostMessageUrl, JSON.stringify(data));
});

$(document).on('keyup', '.js-chat-input', function (event) {
    if (event.shiftKey && event.keyCode === 13) {
        return;
    }
    if (event.keyCode === 13) {
        $(this).val("");
        $(this).css('height', '40px');
    }
});

$(document).on('keyup', '.js-chat-input', debounce(function (event) {
    channels[channelId].endTyping();
}, 1500));

$(document).on('change keyup keydown paste cut', '.js-chat-input', function () {
    $(this).height(0).height(this.scrollHeight - 20);
}).find('.js-chat-input').change();

$(document).on('keydown', '.js-chat-input', function (event) {
    var inp = String.fromCharCode(event.keyCode);
    if (/[a-zA-Z0-9-_ ]/.test(inp)) { // if key is alphanum - start typing
        channels[channelId].startTyping();
    }
    if (event.shiftKey && event.keyCode === 13) {
        return;
    }
    if (event.keyCode !== 13) {
        return;
    }
    var userMessage = $(this).val();
    if (userMessage.length === 0) {

    }
    if (handleUserMessage(userMessage)) {
        $(this).css('height', '40px');
    }
});

function handleUserMessage(userMessage) {
    if (userMessage.length <= 0) {
        return false;
    }
    var data = {
        userId: userId,
        msg: userMessage,
        channelId: channelId
    };

    channels[channelId].sendUserMessage(userMessage, null, '', function (message, error) {
        if (error) {
            console.error(error);
            return;
        }
        channels[channelId].endTyping();
        parseMessage(message);
        scrollChatToBottom();
    });
    $.post(apiPostMessageUrl, JSON.stringify(data));
    return true;
}

$(document).on('click', '.chat-column__attach', function (event) {
    event.preventDefault();
    $('.chat-column__file-input').first().click();
});

$(document).on('change', '.chat-column__file-input', function (event) {
    event.preventDefault();
    var userFile = $(this).prop('files')[0];
    var formData = getFormData();
    formData.append('file', userFile);

    $.ajax({
        url: '/upload-chat',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (data) {
            // renderUploadedFile(data);
            scrollChatToBottom();
        },
        error: function (error) {
            console.error(error);
        },
    });
});

function getFormData() {
    var formData = new FormData();
    formData.append('userId', userId);
    formData.append('channelId', channelId);
    return formData;
}

function renderUploadedFile(filepath, thumbpath) {
    var path = filepath;
    var filename = path.split('/').pop();
    var date = new Date();
    var dateAsString = date.toDateString() + date.toLocaleTimeString();
    renderDoc(channelId, filename, 'misterx', dateAsString, path, thumbpath, true);
}

$(document).on('click', '.text-image', function () {
    modal.find('img').first().attr('src', $(this).attr('src'));
    var fileUrl = modal.find('#open-file__url');
    fileUrl.attr('href', $(this).attr('data-file-url'));
    fileUrl.attr('target', '_blank');
    modal.show();
});

$(document).on('click', '.close-modal', function () {
    modal.hide();
});

function getProfileUrl(messageObject) {
    if (!messageObject.sender) {
        return '';
    }
    return messageObject.sender.profileUrl.replace('http://omne', 'https://www.omne').replace('http://botvest', 'https://www.botvest');
}

function getNickname(messageObject) {
    if (!messageObject.sender) {
        return 'Admin';
    }
    return messageObject.sender.nickname;
}

function messageHasInput(messageObject) {
    return messageObject.customType == 'url_preview_input_string'
        || messageObject.customType == 'url_preview_input_int'
        || messageObject.customType == 'url_preview_multiple_inputs';
}

$(document).on('click', '.js-chat-scroll', function (event) {
    event.preventDefault();
    scrollChatToBottom();
});

function isAdminMessage(messageObject) {
    return messageObject.messageType == 'admin';
}

$(document).bind('drop dragover', function (e) {
    e.preventDefault();
});

var dropZone = jsChatColumn;
$('#fileupload').fileupload({
    dropZone: dropZone,
    add: function (e, data) {
        for (var i in data.files) {
            var formData = getFormData();
            formData.append('file', data.files[i]);
            var $fileContainer = $('.uploaded-file').first().clone();
            $fileContainer.find('.uploaded-file__info h1').first().text(data.files[i].name);
            // var id = hashFnv32a(data.files[i].name.replace(/\s/g, "_"));
            // $fileContainer.attr('id', id);
            addMessageToChatColumn($fileContainer, channelId);
            scrollChatToBottom();
            $.ajax({
                url: '/upload-chat',
                type: 'POST',
                data: formData,
                // Tell jQuery not to process data or worry about content-type
                // You *must* include these options!
                cache: false,
                contentType: false,
                processData: false,

                // Custom XMLHttpRequest
                xhr: function () {
                    var myXhr = $.ajaxSettings.xhr();
                    // if (myXhr.upload) {
                    //     // For handling the progress of the upload
                    //     myXhr.upload.addEventListener('progress', function (e) {
                    //         if (e.lengthComputable) {
                    //             var percentage = parseFloat(e.loaded / e.total).toFixed(2) * 100;
                    //             if (percentage === 100) {
                    //                 setTimeout(function () {
                    //                     $fileContainer.find('circle').first().parent().fadeOut('fast', function () {
                    //                         $(this).closest('.uploaded-file').remove();
                    //                     });
                    //                 }, 1000)
                    //             }
                    //             setProgress(percentage, $fileContainer.find('circle').first()[0]);
                    //         }
                    //     }, false);
                    // }
                    return myXhr;
                },
                success: function (data) {
                    // renderUploadedFile(data);
                    // scrollChatToBottom();
                },
                error: function (error) {
                    console.error(error);
                },
            });
        }
    },
});

// timeout = window.dropZoneTimeout;
var dragOverlay = dropZone.find('.drag-and-drop').first();
$(document).bind('dragover', function (e) {
    if ($(e.target).parents('#js-chat-column').length > 0) {
        dragOverlay.css('display', 'flex');
    } else {
        dragOverlay.hide();
    }
});

$(document).bind('drop', function () {
    dragOverlay.hide();
});

// function setProgress(percent, element) {
//     var circle = element;
//     var radius = circle.r.baseVal.value;
//     var circumference = radius * 2 * Math.PI;
//
//     circle.style.strokeDasharray = circumference + ' ' + circumference;
//     circle.style.strokeDashoffset = circumference;
//     circle.style.strokeDashoffset = circumference - percent / 100 * circumference;
// }

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function addMessageToChatColumn(message, channelId) {
    var channelMessagesContainer = $('#' + channelId);
    if (channelMessagesContainer.length === 0) {
        if (shouldUseInverseMode) {
            hiddenContainers[channelId].prepend(message);
        } else {
            hiddenContainers[channelId].append(message);
        }
    } else {
        if (shouldUseInverseMode) {
            message.prependTo(channelMessagesContainer);
        } else {
            message.appendTo(channelMessagesContainer);
        }
    }
    message.show();
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

function mobileCheck() {
    var check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
}

if (mobileCheck()) {
    var $downloadApps = $('.download-apps').first();
    $('.js-column').each(function (index, item) {
        $(item).hide();
    });
    $downloadApps.show();
}

$('#customSelect').each(selectInit);

function selectInit() {
    var $this = $(this), numberOfOptions = $(this).children('option').length;

    $this.addClass('select-hidden');
    $this.wrap('<div class="select"></div>');
    $this.after('<div class="select-styled"></div>');

    var $styledSelect = $this.next('div.select-styled');
    $styledSelect.text($this.children('option').eq(0).text());

    var $list = $('<ul />', {
        'class': 'select-options'
    }).insertAfter($styledSelect);

    for (var i = 0; i < numberOfOptions; i++) {
        $('<li />', {
            text: $this.children('option').eq(i).text(),
            rel: $this.children('option').eq(i).val()
        }).appendTo($list);
    }

    var $listItems = $list.children('li');

    $styledSelect.click(function (e) {
        e.stopPropagation();
        $('div.select-styled.active').not(this).each(function () {
            $(this).removeClass('active').next('ul.select-options').hide();
        });
        $(this).toggleClass('active').next('ul.select-options').toggle();
    });

    $listItems.click(function (e) {
        $('.select').each(function (index, item) {
            $(item).hide();
        });
        e.stopPropagation();
        $styledSelect.text($(this).text()).removeClass('active');
        $this.val($(this).attr('rel'));
        $list.hide();
        $('.js-chat-input').show();
        var questionId = $this.attr('data-questionId');
        var selected = $this.val();
        var data = {
            userId: userId,
            msg: {
                replies: selected,
                questionId: questionId
            },
            channelId: channelId
        };
        $.post(apiPostMessageUrl, JSON.stringify(data))
            .always(function () {

            });
    });

    $(document).click(function () {
        $styledSelect.removeClass('active');
        $list.hide();
    });
}

var tokenTriggered = false;
var handler = StripeCheckout.configure({
    key: 'pk_live_ms0wO9HQtHsHG2gWJq0wahLz', // FIXME get from some other place??
    // key: 'pk_test_pavnBBACknzbepGLWntkBJXy', // FIXME get from some other place??
    image: 'https://www.omne.ai/img/favicon-32x32.png',
    locale: 'auto',
    currency: 'eur',
    token: function (token) {
        // You can access the token ID with `token.id`.
        // Get the token ID to your server-side code for use.
        console.log(token);
        tokenTriggered = true;
    },
    closed: function() {
        if (tokenTriggered) {
            window.location.reload(true);
        }
    },
});

$(document).on('click', '.payment-button', function (event) {
    event.preventDefault();
    handler.open({
        name: 'La Villa del Lago',
        description: $(this).attr('data-description'),
        zipCode: true,
        currency: 'eur',
        amount: $(this).attr('data-amount')
    });
});

var searchBarOffset = 42; // FIXME remove hardcode, calculate that value
$('#graphs-container').on('scroll', function () {
    var searchBar = $('#search-bar');
    var navBar = $('.nav-justified').first().parent();
    if ($(this).scrollTop() >= searchBarOffset) {
        searchBar.addClass('sticky');
        navBar.addClass('tabs__sticky');
    } else {
        searchBar.removeClass('sticky');
        navBar.removeClass('tabs__sticky');
    }
});

function changeTitle() {
    document.title = isOldTitle ? oldTitle : newTitle;
    $('#favicon').attr('href', isOldTitle ? oldFavicon : newFavicon);
    isOldTitle = !isOldTitle;
}

$(window).focus(function () {
    clearInterval(interval);
    interval = null;
    $("title").text(oldTitle);
    $('#favicon').attr('href', oldFavicon);
});
var observer = lozad();
observer.observe();

var channelUsers = [];
$('#js-users-list-button').click(function (event) {
    event.preventDefault();
    var modal = $('#exampleModal');
    var modalBody = modal.find('.modal-body').first();
    modalBody.text('Loading...');
    var data = {
        channelId: channelId
    };
    $.post('/list-members', JSON.stringify(data), function (response) {
        channelUsers[channelId] = response.members;
        renderMembers();
    });
});

$('#js-invoice-button').click(function (event) {
    event.preventDefault();
});

$('#add-portfolio').click(function (event) {
    event.preventDefault();
    $('#new-portfolio-modal').modal();
});

function renderMembers() {
    var modal = $('#exampleModal');
    var modalBody = modal.find('.modal-body').first();
    modalBody.empty();
    for (var i in channelUsers[channelId]) {
        var userDiv = $('<div></div>').addClass('channel-user');
        var avatar = $('<img/>').addClass('channel-user__avatar').attr('src', channelUsers[channelId][i].profile_url.replace('http://omne', 'https://www.omne').replace('http://botvest', 'https://www.botvest'));
        var name = $('<span></span>').addClass('channel-user__name').text(channelUsers[channelId][i].nickname);
        var status = $('<span></span>').addClass('channel-user__status');
        var nameContainer = $('<div class="user-name__container"></div>');
        if (channelUsers[channelId][i].is_online || channelUsers[channelId][i].last_seen_at == 0) {
            status.addClass('online');
            status.text('Online');
        } else {
            var date = new Date(channelUsers[channelId][i].last_seen_at);
            var seentAt = date.getDate() + '/' + parseInt(parseInt(date.getMonth()) + 1) + '/' + date.getFullYear();
            status.text('last seen ' + seentAt);
        }
        avatar.appendTo(userDiv);
        name.appendTo(nameContainer);
        status.appendTo(nameContainer);
        nameContainer.appendTo(userDiv);
        userDiv.appendTo(modalBody);
    }
    $('<input type="text" class="form-control" id="new-user-id">').appendTo(modalBody);
    var $leaveButton = $('<button id="user-leave" class="btn btn-default user-operation" data-toggle="tooltip" data-placement="top" title="Leave"><img src="/static/img/leave.png"></button>');
    var $inviteButton = $('<button id="user-invite" class="btn btn-default user-operation" data-toggle="tooltip" data-placement="top" title="Invite"><img src="/static/img/invite.png"></button>');
    var $userOperationsContainer = $('<div class="user-operation__container"></div>');
    $inviteButton.tooltip();
    $leaveButton.tooltip();
    $inviteButton.appendTo($userOperationsContainer);
    $leaveButton.appendTo($userOperationsContainer);
    $userOperationsContainer.appendTo(modalBody);
    modal.modal();
}

$('#js-form-submit').click(function (event) {
    event.preventDefault();
    var $userMessageInput = $('.js-chat-input');
    var userMessage = $userMessageInput.val();
    if (handleUserMessage(userMessage)) {
        $userMessageInput.val('');
    }
});

$(document).on('click', '#user-leave', function (event) {
    event.preventDefault();
    var data = {
        channelId: channelId,
        userId: $('#new-user-id').val(),
    };
    $.post('/leave', JSON.stringify(data))
        .done(function () {
            window.location.reload(true);
        })
        .fail(function (error) {
            console.error(error);
        });
});

$(document).on('click', '#user-invite', function (event) {
    event.preventDefault();
    var data = {
        channelId: channelId,
        userId: $('#new-user-id').val(),
    };
    $.post('/invite', JSON.stringify(data))
        .done(function () {
            window.location.reload(true);
        })
        .fail(function (error) {
            console.error(error);
        });
});

$('#add-portfolio-submit').click(function (event) {
    event.preventDefault();
    var $portfolioNameInput = $('#new-portfolio-name');
    var data = {
        userId: userId,
        portfolio_name: $portfolioNameInput.val(),
    };
    $.post('/startportfolio', JSON.stringify(data))
        .done(function () {
            window.location.reload(true);
        })
        .fail(function (error) {
            console.error(error);
        });
    $portfolioNameInput.val('');
});

$(document).on('click', '.js-sync-button', function (event) {
    event.preventDefault();
    $(this).addClass('portfolio-syncing');
    var syncingChannelId = $(this).attr('data-channelId');
    $.post('/refresh-portfolio', JSON.stringify({ channelId: syncingChannelId }))
        .done(function () {
            window.location.href = window.location.href.split('?')[0] + '?channelId=' + syncingChannelId;
        })
        .fail(function (error) {
            console.error(error);
        });
});

$('a[data-toggle=tab]').on('shown.bs.tab', function (e) {
    window.dispatchEvent(new Event('resize'));
});

$(document).on('click', '.file-delete', function (e) {
    e.preventDefault();
    var filename = $(this).parent().find('.file-description__filename').first().text();
    var data = {
        filename: filename,
        channelId: channelId
    };
    var element = $(this).parent();

    $.post('deletedocs', JSON.stringify(data))
        .done(function () {
            element.fadeOut();
        })
        .fail(function () {
            console.error('error');
        });

});

// DO NOT TOUCH used from iframe
function submitInvoice(json) {
    // console.log(json);
    var data = {
        "userId": userId,
        "channelId": channelId,
        "Invoice": json
    };
    $.post('/insert-inv-data', JSON.stringify(data)).done(function (response) {
        if (response.error == 'True') { // bue
            var errorMsg = response.msg;
            $('#invoice-modal').find('.modal-body').prepend($('<div class="alert alert-danger" role="alert">' + errorMsg + '</div>'));
        } else {
            $('#invoice-modal').modal('hide');
        }
    });
}

window.onload = function () {
    $('#loader-overlay').hide();
    $('#concierge-iframe').attr('src','/concierge-example');
    $('#invoice-generator').attr('src','/insert-trans');
    getPortfolioData();
};

$('#invoice-modal').on('hidden.bs.modal', function (e) {
    $('#invoice-modal').find('.modal-body').find('alert-danger').remove();
});

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a target="_blank" href="' + url + '">' + url + '</a>';
    })
}

$(document).on('click', '.js-portfolio-image', function () {
    $($(this).siblings()[0]).click();
});

$avatar.on('click', function () {
    event.preventDefault();
    $('#avatar-file-input').first().click();
});

$(document).on('change', '#avatar-file-input', function (event) {
    event.preventDefault();
    var userFile = $(this).prop('files')[0];
    var formData = getFormData();
    formData.append('file', userFile);

    $.ajax({
        url: '/update-profile-pic',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (data) {
            window.location.reload(true);
        },
        error: function (error) {
            console.error(error);
        },
    });x
});

$(document).on('change', '.js-portfolio-image-input', function (event) {
    event.preventDefault();
    var userFile = $(this).prop('files')[0];
    var formData = getFormData();
    formData.append('file', userFile);
    $.ajax({
        url: '/update-channel-pic',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (data) {
            window.location.reload(true);
        },
        error: function (error) {
            console.error(error);
        },
    });
});

$('#load-more-button').click(function (event) {
    event.preventDefault();
    var button = $(this);
    if (button.hasClass('disabled')) {
        return;
    }
    button.addClass('disabled');
    button.html('<i class="fa fa-spinner fa-spin"></i>');
    $.get('/get-additional-channels/' + userId, '', function (response) {
        if (response.error) {
            renderPortfolios(response.portList);
            initSendBird(false);
        }
        button.removeClass('disabled');
        button.html('Load more');
    });
});

var processedChannels = [];

function getPortfolioData() {
    $('.js-graphs-loader-overlay').show();
    var url = '/getchannelgraph/' + channelId + '?uniqid=' + Math.random();
    $.get(url, '', function (response) {
        handlerChannelDataResponse(response);
        $('.js-graphs-loader-overlay').hide();
        var observer = lozad();
        observer.observe();
        processedChannels[channelId] = response;
    });
}

function handlerChannelDataResponse(response) {
    $('.file-container').not('.hidden').hide();
    for (var i in response.documents) {
        renderChannelFiles(response.documents[i]);
    }
    renderGraphsFromJson(response.graphs);
}
