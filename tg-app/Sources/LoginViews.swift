import SwiftUI

struct PhoneLoginView: View {
    @EnvironmentObject var tg: TDService
    @State private var phone = "+998"
    @State private var busy = false

    var body: some View {
        VStack(spacing: 16) {
            Text("Telefon raqamingiz").font(.title2.bold())
            TextField("+998...", text: $phone)
                .keyboardType(.phonePad)
                .textFieldStyle(.roundedBorder)
            Button("Kodni yuborish") {
                busy = true
                Task { await tg.sendPhone(phone.trimmingCharacters(in: .whitespaces)); busy = false }
            }
            .buttonStyle(.borderedProminent)
            .disabled(busy || phone.count < 8)
            ErrorLabel()
        }
        .padding(24)
    }
}

struct CodeLoginView: View {
    @EnvironmentObject var tg: TDService
    @State private var code = ""

    var body: some View {
        VStack(spacing: 16) {
            Text("Kodni kiriting").font(.title2.bold())
            TextField("12345", text: $code)
                .keyboardType(.numberPad)
                .textFieldStyle(.roundedBorder)
            Button("Tasdiqlash") {
                Task { await tg.sendCode(code) }
            }
            .buttonStyle(.borderedProminent)
            .disabled(code.count < 4)
            ErrorLabel()
        }
        .padding(24)
    }
}

struct PasswordView: View {
    @EnvironmentObject var tg: TDService
    @State private var password = ""

    var body: some View {
        VStack(spacing: 16) {
            Text("Ikki bosqichli parol").font(.title2.bold())
            SecureField("Parol", text: $password)
                .textFieldStyle(.roundedBorder)
            Button("Kirish") {
                Task { await tg.sendPassword(password) }
            }
            .buttonStyle(.borderedProminent)
            .disabled(password.isEmpty)
            ErrorLabel()
        }
        .padding(24)
    }
}

struct ErrorLabel: View {
    @EnvironmentObject var tg: TDService
    var body: some View {
        if let e = tg.errorText {
            Text(e).font(.footnote).foregroundColor(.red).multilineTextAlignment(.center)
        }
    }
}
