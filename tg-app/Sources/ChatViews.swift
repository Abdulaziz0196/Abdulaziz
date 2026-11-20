import SwiftUI
import TDLibKit

struct ChatListView: View {
    @EnvironmentObject var tg: TDService

    var body: some View {
        NavigationStack {
            List(tg.chats) { chat in
                NavigationLink(value: chat) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(chat.title).font(.headline)
                        Text(tg.lastPreview(for: chat))
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
            }
            .navigationTitle("Chatlar")
            .navigationDestination(for: Chat.self) { chat in
                ChatView(chat: chat)
            }
            .overlay {
                if tg.chats.isEmpty { ProgressView("Chatlar yuklanmoqda...") }
            }
        }
    }
}

struct ChatView: View {
    @EnvironmentObject var tg: TDService
    let chat: Chat
    @State private var draft = ""

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(tg.messages[chat.id] ?? [], id: \.id) { m in
                            Bubble(message: m).id(m.id)
                        }
                    }
                    .padding()
                }
                .onChange(of: tg.messages[chat.id]?.count ?? 0) { _ in
                    if let last = tg.messages[chat.id]?.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            HStack {
                TextField("Xabar", text: $draft, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...5)
                Button {
                    let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !text.isEmpty else { return }
                    draft = ""
                    Task { await tg.send(text, chatId: chat.id) }
                } label: {
                    Image(systemName: "paperplane.fill")
                }
                .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .navigationTitle(chat.title)
        .navigationBarTitleDisplayMode(.inline)
        .task { await tg.loadHistory(chatId: chat.id) }
    }
}

struct Bubble: View {
    let message: Message

    var body: some View {
        HStack {
            if message.isOutgoing { Spacer(minLength: 40) }
            Text(TDService.text(of: message))
                .padding(10)
                .background(message.isOutgoing ? Color.blue : Color(.secondarySystemBackground))
                .foregroundColor(message.isOutgoing ? .white : .primary)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            if !message.isOutgoing { Spacer(minLength: 40) }
        }
        .frame(maxWidth: .infinity)
    }
}
