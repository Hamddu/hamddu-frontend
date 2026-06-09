import UIKit

@objc(ScreenshotProtect)
class ScreenshotProtect: NSObject {
  private static var secureContainer: UITextField?

  private static func keyWindow() -> UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
  }

  @objc func enable() {
    DispatchQueue.main.async {
      guard ScreenshotProtect.secureContainer == nil,
            let window = ScreenshotProtect.keyWindow(),
            let rootView = window.rootViewController?.view else { return }

      let container = UITextField()
      container.isSecureTextEntry = true
      container.frame = window.bounds
      container.autoresizingMask = [.flexibleWidth, .flexibleHeight]

      rootView.removeFromSuperview()
      container.addSubview(rootView)
      rootView.frame = container.bounds
      rootView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

      window.addSubview(container)
      ScreenshotProtect.secureContainer = container
    }
  }

  @objc func disable() {
    DispatchQueue.main.async {
      guard let container = ScreenshotProtect.secureContainer,
            let window = ScreenshotProtect.keyWindow(),
            let rootView = container.subviews.first else { return }

      rootView.removeFromSuperview()
      window.addSubview(rootView)
      rootView.frame = window.bounds
      rootView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

      container.removeFromSuperview()
      ScreenshotProtect.secureContainer = nil
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { return true }
}
