import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var splashView: UIView?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let bridge = CAPBridgeViewController()
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = bridge
        window?.backgroundColor = .black
        window?.makeKeyAndVisible()

        showSplash(over: bridge.view)
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    /// Keep TurNov on screen long enough to read, then fade into the game.
    private func showSplash(over host: UIView?) {
        guard let host else { return }

        let splash = UIView(frame: host.bounds)
        splash.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        splash.backgroundColor = .black
        splash.isUserInteractionEnabled = false

        let logo = UIImageView(image: UIImage(named: "LaunchLogo"))
        logo.contentMode = .scaleAspectFit
        logo.translatesAutoresizingMaskIntoConstraints = false
        splash.addSubview(logo)

        NSLayoutConstraint.activate([
            logo.centerXAnchor.constraint(equalTo: splash.centerXAnchor),
            logo.centerYAnchor.constraint(equalTo: splash.centerYAnchor),
            logo.widthAnchor.constraint(equalTo: splash.widthAnchor, multiplier: 0.72),
            logo.widthAnchor.constraint(lessThanOrEqualToConstant: 420),
            logo.heightAnchor.constraint(equalTo: logo.widthAnchor),
        ])

        host.addSubview(splash)
        splashView = splash

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.35) { [weak self] in
            UIView.animate(withDuration: 0.35, animations: {
                splash.alpha = 0
            }, completion: { _ in
                splash.removeFromSuperview()
                if self?.splashView === splash {
                    self?.splashView = nil
                }
            })
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
