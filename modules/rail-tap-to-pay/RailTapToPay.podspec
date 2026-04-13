Pod::Spec.new do |s|
  s.name         = "RailTapToPay"
  s.version      = "1.0.0"
  s.summary      = "Multipeer Connectivity tap-to-pay for Rail"
  s.homepage     = "https://userail.money"
  s.license      = "MIT"
  s.author       = "Rail"
  s.platform     = :ios, "15.0"
  s.source       = { :path => "." }
  s.source_files = "ios/**/*.{h,m,mm}"
  s.frameworks      = "MultipeerConnectivity", "NearbyInteraction"
  s.dependency "React-Core"
end
