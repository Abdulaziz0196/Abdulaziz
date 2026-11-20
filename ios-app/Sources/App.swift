import SwiftUI

@main
struct SimpleApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct Message: Identifiable {
    let id = UUID()
    let text: String
    let date: Date
}

struct ContentView: View {
    @State private var messages: [Message] = []
    @State private var draft: String = ""

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                List(messages) { message in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(message.text)
                        Text(message.date, style: .time)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .listStyle(.plain)

                HStack {
                    TextField("Xabar yozing...", text: $draft)
                        .textFieldStyle(.roundedBorder)
                    Button("Yuborish") {
                        let trimmed = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard !trimmed.isEmpty else { return }
                        messages.append(Message(text: trimmed, date: Date()))
                        draft = ""
                    }
                    .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding()
            }
            .navigationTitle("Oddiy chat")
        }
    }
}
