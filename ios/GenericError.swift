import Foundation

struct GenericError: LocalizedError {
  var message: String
  init(_ message: String) { self.message = message }

  var errorDescription: String? {
    return message
  }
}
