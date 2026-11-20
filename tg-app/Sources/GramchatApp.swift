import SwiftUI

@main
struct GramchatApp: App {
    @StateObject private var tg = TDService()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(tg)
        }
    }
}

struct RootView: View {
    @EnvironmentObject var tg: TDService

    var body: some View {
        switch tg.phase {
        case .starting:
            ProgressView("Ulanmoqda...")
        case .phone:
            PhoneLoginView()
        case .code:
            CodeLoginView()
        case .password:
            PasswordView()
        case .ready:
            ChatListView()
        case .closed:
            Text("Sessiya yopildi. Ilovani qayta oching.")
        }
    }
}
