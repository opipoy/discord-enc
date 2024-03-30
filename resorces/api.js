// very thanks for https://github.com/rigwild/discord-self-bot-console/blob/main/index.js for making this possible


var gid = '' // Current guild id
var cid = '' // Current channel id
var authHeader = '' // Authorization token
var autoUpdateToken = false // Should the token be updated automatically when a request with the token is intercepted?

    // Call this to update `cid` and `gid` to current channel and guild id
var update_guildId_and_channelId_withCurrentlyVisible = () => {
    gid = window.location.href.split('/').slice(4)[0]
    cid = window.location.href.split('/').slice(4)[1]
}
export var id = update_guildId_and_channelId_withCurrentlyVisible

export var delay = ms => new Promise(res => setTimeout(res, ms))
// prettier-ignore
var qs = obj => Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('&')

/** @type {import('./types').api['apiCall']} */
export var apiCall = (apiPath, body, method = 'GET', options = {}) => {
        if (!authHeader) throw new Error("The authorization token is missing. Did you forget to set it? `authHeader = 'your_token'`")

        const fetchOptions = {
            body: body ? body : undefined,
            method,
            headers: {
                Accept: '*/*',
                'Accept-Language': 'en-US',
                Authorization: authHeader,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9015 Chrome/108.0.5359.215 Electron/22.3.12 Safari/537.36',
                'X-Super-Properties': btoa(
                    JSON.stringify({
                        os: 'Windows',
                        browser: 'Discord Client',
                        release_channel: 'stable',
                        client_version: '1.0.9030',
                        os_version: '10.0.22631',
                        os_arch: 'x64',
                        app_arch: 'ia32',
                        system_locale: 'en-US',
                        browser_user_agent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9030 Chrome/108.0.5359.215 Electron/22.3.26 Safari/537.36',
                        browser_version: '22.3.26',
                        client_build_number: 260101,
                        native_build_number: 42656,
                        client_event_source: null,
                    }),
                ),
            },
            ...options,
        }
        const isFormData = body?.constructor?.name === 'FormData'
        if (!isFormData) {
            fetchOptions.headers['Content-Type'] = 'application/json'
            fetchOptions.body = JSON.stringify(body)
        }
        return fetch(`https://discord.com/api/v9${apiPath}`, fetchOptions)
            .then(res => res.json().catch(() => {}))
            .catch(console.error)
    }

    export var api = {
        getMessages: (channelOrThreadId, limit = 100, params = {}) => apiCall(`/channels/${channelOrThreadId}/messages?limit=${limit ?? 100}&${qs(params)}`),
        sendMessage: (channelOrThreadId, message, tts, body = {}) => apiCall(`/channels/${channelOrThreadId}/messages`, { content: message, tts: !!tts, ...body }, 'POST'),
        replyToMessage: (channelOrThreadId, repliedMessageId, message, tts, body = {}) =>
        apiCall(`/channels/${channelOrThreadId}/messages`, { content: message, message_reference: { message_id: repliedMessageId }, tts: !!tts, ...body }, 'POST'),
        editMessage: (channelOrThreadId, messageId, newMessage, body = {}) => apiCall(`/channels/${channelOrThreadId}/messages/${messageId}`, { content: newMessage, ...body }, 'PATCH'),
        deleteMessage: (channelOrThreadId, messageId) => apiCall(`/channels/${channelOrThreadId}/messages/${messageId}`, null, 'DELETE'),

        createThread: (channelId, toOpenThreadInmessageId, name, autoArchiveDuration = 1440, body = {}) =>
        apiCall(`/channels/${channelId}/messages/${toOpenThreadInmessageId}/threads`, { name, auto_archive_duration: autoArchiveDuration, location: 'Message', type: 11, ...body }, 'POST'),
        createThreadWithoutMessage: (channelId, name, autoArchiveDuration = 1440, body = {}) =>
        apiCall(`/channels/${channelId}/threads`, { name, auto_archive_duration: autoArchiveDuration, location: 'Message', type: 11, ...body }, 'POST'),
        deleteThread: threadId => apiCall(`/channels/${threadId}`, null, 'DELETE'),

        // Use this generator: https://discord.club/dashboard
        // Click `+` at the bottom in the embed section then copy the `embed` key in the JSON output.
        // Does not work with user account anymore!
        sendEmbed: (channelOrThreadId, embed = { title: 'Title', description: 'Description' }) => apiCall(`/channels/${channelOrThreadId}/messages`, { embed }, 'POST'),

        getRoles: guildId => apiCall(`/guilds/${guildId}/roles`),
        createRole: (guildId, name) => apiCall(`/guilds/${guildId}/roles`, { name }, 'POST'),
        deleteRole: (guildId, roleId) => apiCall(`/guilds/${guildId}/roles/${roleId}`, null, 'DELETE'),

        getBans: guildId => apiCall(`/guilds/${guildId}/bans`),
        banUser: (guildId, userId, reason) => apiCall(`/guilds/${guildId}/bans/${userId}`, { delete_message_days: '7', reason }, 'PUT'),
        unbanUser: (guildId, userId) => apiCall(`/guilds/${guildId}/bans/${userId}`, null, 'DELETE'),
        kickUser: (guildId, userId) => apiCall(`/guilds/${guildId}/members/${userId}`, null, 'DELETE'),

        addRole: (guildId, userId, roleId) => apiCall(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, null, 'PUT'),
        removeRole: (guildId, userId, roleId) => apiCall(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, null, 'DELETE'),

        auditLogs: guildId => apiCall(`/guilds/${guildId}/audit-logs`),

        getChannels: guildId => apiCall(`/guilds/${guildId}/channels`),
        createChannel: (guildId, name, type) => apiCall(`/guilds/${guildId}/channels`, { name, type }, 'POST'),
        deleteChannel: channelId => apiCall(`/channels/${channelId}`, null, 'DELETE'),
        getChannel: channelOrThreadId => apiCall(`/channels/${channelOrThreadId}`),

        pinnedMessages: channelId => apiCall(`/channels/${channelId}/pins`),
        addPin: (channelId, messageId) => apiCall(`/channels/${channelId}/pins/${messageId}`, null, 'PUT'),
        deletePin: (channelId, messageId) => apiCall(`/channels/${channelId}/pins/${messageId}`, null, 'DELETE'),

        listEmojis: guildId => apiCall(`/guilds/${guildId}/emojis`),
        getEmoji: (guildId, emojiId) => apiCall(`/guilds/${guildId}/emojis/${emojiId}`),
        createEmoji: (guildId, name, image, roles) => apiCall(`/guilds/${guildId}`, { name, image, roles }, 'POST'),
        editEmoji: (guildId, emojiId, name, roles) => apiCall(`/guilds/${guildId}/${emojiId}`, { name, roles }, 'PATCH'),
        deleteEmoji: (guildId, emojiId) => apiCall(`/guilds/${guildId}/${emojiId}`, null, 'DELETE'),

        searchSlashCommand: (channelOrThreadId, search) => apiCall(`/channels/${channelOrThreadId}/application-commands/search?type=1&query=${search}&limit=25&include_applications=true`),
        sendSlashCommand: (guildId, channelOrThreadId, command, commandOptions = []) => {
            const formData = new FormData()
            formData.append(
                'payload_json',
                JSON.stringify({
                    type: 2,
                    application_id: command.application_id,
                    guild_id: guildId,
                    channel_id: channelOrThreadId,
                    session_id: 'requiredButUnchecked',
                    nonce: Math.floor(Math.random() * 1000000) + '',
                    data: {
                        ...command,
                        options: commandOptions,
                        application_command: {
                            ...command,
                        },
                    },
                }),
            )
            return apiCall('/interactions', formData, 'POST')
        },

        changeNick: (guildId, nick) => apiCall(`/guilds/${guildId}/members/@me/nick`, { nick }, 'PATCH'),
        leaveServer: guildId => apiCall(`/users/@me/guilds/${guildId}`, null, 'DELETE'),

        getServers: () => apiCall(`/users/@me/guilds`),
        getGuilds: () => apiCall(`/users/@me/guilds`),
        listCurrentUserGuilds: () => apiCall('/users/@me/guilds'),

        getDMs: () => apiCall(`/users/@me/channels`),
        getUser: userId => apiCall(`/users/${userId}`),

        getDirectFriendInviteLinks: () => apiCall(`/users/@me/invites`),
        createDirectFriendInviteLink: () => apiCall(`/users/@me/invites`, null, 'POST'),
        deleteDirectFriendInviteLinks: () => apiCall(`/users/@me/invites`, null, 'DELETE'),

        getCurrentUser: () => apiCall('/users/@me'),
        editCurrentUser: (username, bio, body = {}) => apiCall('/users/@me', { username: username ?? undefined, bio: bio ?? undefined, ...body }, 'PATCH'),

        setCustomStatus: (emojiId, emojiName, expiresAt, text) =>
        apiCall(`/users/@me/settings`, { custom_status: { emoji_id: emojiId, emoji_name: emojiName, expires_at: expiresAt, text: text } }, 'PATCH'),
        deleteCustomStatus: () => apiCall(`/users/@me/settings`, { custom_status: { expires_at: new Date().toJSON() } }, 'PATCH'),

        listReactions: (channelOrThreadId, messageId, emojiUrl) => apiCall(`/channels/${channelOrThreadId}/messages/${messageId}/reactions/${emojiUrl}/@me`),
        addReaction: (channelOrThreadId, messageId, emojiUrl) => apiCall(`/channels/${channelOrThreadId}/messages/${messageId}/reactions/${emojiUrl}/@me`, null, 'PUT'),
        deleteReaction: (channelOrThreadId, messageId, emojiUrl) => apiCall(`/channels/${channelOrThreadId}/messages/${messageId}/reactions/${emojiUrl}/@me`, null, 'DELETE'),

        typing: channelOrThreadId => apiCall(`/channels/${channelOrThreadId}/typing`, null, 'POST'),

        delay,
        downloadFileByUrl: (url, filename) =>
        fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = filename
            link.click()
        })
        .catch(console.error),
        apiCall,
        id,
        update_guildId_and_channelId_withCurrentlyVisible,
        getConfig: () => Object.freeze({ authHeader, autoUpdateToken, guildId: gid, channelId: cid, gid, cid }),
        setConfigAuthHeader: token => (authHeader = token),
        setConfigAutoUpdateToken: bool => (autoUpdateToken = bool),
        setConfigGid: id => (gid = id),
        setConfigGuildId: id => (gid = id),
        setConfigCid: id => (cid = id),
        setConfigChannelId: id => (cid = id),
    }


id()

//if (!module) {
    //    // Allow pasting this script in the console
    //    // @ts-ignore
    //    var module = {}
    //}
//module.exports = { api, id, delay, update_guildId_and_channelId_withCurrentlyVisible }

