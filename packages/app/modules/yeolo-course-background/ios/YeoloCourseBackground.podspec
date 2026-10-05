Pod::Spec.new do |s|
  s.name = 'YeoloCourseBackground'
  s.version = '1.0.0'
  s.summary = 'Background execution protection for course generation'
  s.description = s.summary
  s.license = { :type => 'ISC' }
  s.author = 'Yeolo'
  s.homepage = 'https://www.yeolo.app'
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'UIKit', 'BackgroundTasks'
  s.source_files = '**/*.swift'
  s.exclude_files = 'Tests/**/*'
end
