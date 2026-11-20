import Foundation
import UIKit
import TDLibKit

@MainActor
final class TDService: ObservableObject {
    enum Phase: Equatable { case starting, phone, code, password, ready, closed }

    @Published var phase: Phase = .starting
    @Published var chats: [Chat] = []
    @Published var messages: [Int64: [Message]] = [:]
    @Published var errorText: String?

    private var manager: TDLibClientManager?
    private var client: TDLibClient?
    private var chatById: [Int64: Chat] = [:]
    private var lastMessageById: [Int64: Message] = [:]

    init() {
        let manager = TDLibClientManager()
        self.manager = manager
        self.client = manager.createClient { [weak self] data, _ in
            guard let update = try? JSONDecoder().decode(Update.self, from: data) else { return }
            Task { @MainActor in self?.handle(update) }
        }
    }

    // MARK: - Auth

    private func handle(_ update: Update) {
        switch update {
        case .updateAuthorizationState(let u):
            handleAuth(u.authorizationState)
        case .updateNewChat(let u):
            chatById[u.chat.id] = u.chat
            if let last = u.chat.lastMessage { lastMessageById[u.chat.id] = last }
            refreshChats()
        case .updateChatLastMessage(let u):
            if let last = u.lastMessage { lastMessageById[u.chatId] = last }
            refreshChats()
        case .updateNewMessage(let u):
            let id = u.message.chatId
            lastMessageById[id] = u.message
            if messages[id] != nil { messages[id]?.append(u.message) }
            refreshChats()
        default:
            break
        }
    }

    private func handleAuth(_ state: AuthorizationState) {
        switch state {
        case .authorizationStateWaitTdlibParameters:
            Task { await setParameters() }
        case .authorizationStateWaitPhoneNumber:
            phase = .phone
        case .authorizationStateWaitCode:
            phase = .code
        case .authorizationStateWaitPassword:
            phase = .password
        case .authorizationStateReady:
            phase = .ready
            Task { try? await client?.loadChats(chatList: .chatListMain, limit: 100) }
        case .authorizationStateClosed:
            phase = .closed
        default:
            break
        }
    }

    private func setParameters() async {
        guard let client else { return }
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let dbDir = base.appendingPathComponent("tdlib-db", isDirectory: true)
        let filesDir = base.appendingPathComponent("tdlib-files", isDirectory: true)
        do {
            _ = try await client.setTdlibParameters(
                apiHash: Config.apiHash,
                apiId: Config.apiId,
                applicationVersion: "1.0",
                databaseDirectory: dbDir.path,
                databaseEncryptionKey: nil,
                deviceModel: UIDevice.current.model,
                filesDirectory: filesDir.path,
                systemLanguageCode: Locale.current.languageCode ?? "en",
                systemVersion: UIDevice.current.systemVersion,
                useChatInfoDatabase: true,
                useFileDatabase: true,
                useMessageDatabase: true,
                useSecretChats: false,
                useTestDc: false
            )
        } catch {
            errorText = error.localizedDescription
        }
    }

    func sendPhone(_ phone: String) async {
        do {
            _ = try await client?.setAuthenticationPhoneNumber(phoneNumber: phone, settings: nil)
        } catch { errorText = error.localizedDescription }
    }

    func sendCode(_ code: String) async {
        do {
            _ = try await client?.checkAuthenticationCode(code: code)
        } catch { errorText = error.localizedDescription }
    }

    func sendPassword(_ password: String) async {
        do {
            _ = try await client?.checkAuthenticationPassword(password: password)
        } catch { errorText = error.localizedDescription }
    }

    // MARK: - Chats

    private func refreshChats() {
        chats = chatById.values.sorted {
            date(of: $0.id) > date(of: $1.id)
        }
    }

    private func date(of chatId: Int64) -> Int {
        lastMessageById[chatId]?.date ?? 0
    }

    func lastPreview(for chat: Chat) -> String {
        guard let m = lastMessageById[chat.id] else { return "" }
        return Self.text(of: m)
    }

    static func text(of message: Message) -> String {
        if case .messageText(let t) = message.content { return t.text.text }
        return "[Media]"
    }

    func loadHistory(chatId: Int64) async {
        guard let client else { return }
        do {
            let result = try await client.getChatHistory(
                chatId: chatId, fromMessageId: 0, limit: 50, offset: 0, onlyLocal: false)
            // TDLib eng yangi xabarni birinchi qaytaradi; ekranda eski -> yangi tartibda kerak
            messages[chatId] = Array((result.messages ?? []).reversed())
        } catch {
            errorText = error.localizedDescription
        }
    }

    func send(_ text: String, chatId: Int64) async {
        guard let client else { return }
        let content = InputMessageContent.inputMessageText(
            InputMessageText(
                clearDraft: true,
                linkPreviewOptions: nil,
                text: FormattedText(entities: [], text: text)))
        do {
            _ = try await client.sendMessage(
                chatId: chatId,
                inputMessageContent: content,
                options: nil,
                replyMarkup: nil,
                replyTo: nil,
                topicId: nil)
        } catch {
            errorText = error.localizedDescription
        }
    }
}
