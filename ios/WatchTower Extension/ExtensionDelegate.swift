//
//  ExtensionDelegate.swift
//  WatchTower Extension
//
//  Created by Alex de Mulder on 31/10/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import WatchKit
import WatchConnectivity
import BluenetWatch

var eventBus        = EventBus()
var bluenetManager  = BluenetManager()
var sessionDelegate = SessionDelegate()
var dataStore       = DataStore()


class ExtensionDelegate: NSObject, WKExtensionDelegate {
  
    override init() {
        super.init()
        print("ExtentionDelegate INIT")
//        print("Before", dataStore.store.string(forKey: "test"))
//        //dataStore.store.set("MyData", forKey: "test")
//        print("After", dataStore.store.string(forKey: "test"))
        // Activate the session asynchronously as early as possible.
        // In the case of being background launched with a task, this may save some background runtime budget.
        bluenetManager.subscribeEvents()
        WCSession.default.delegate = sessionDelegate
        WCSession.default.activate()
      
        
        let handleDict = dataStore.store.dictionary(forKey: "handles")
        //print("I GOT THIS \(handleDict)")
        if let theDict = handleDict {
            for (handle, _) in theDict {
                let refId = dataStore.store.string(forKey: handle)
                if let theRefId = refId {
                    print("Loading \(handle) \(theRefId) into bluenet")
                    bluenetManager.bluenet.setKnownValidatedHandle(handle: handle, referenceId: theRefId)
                }
            }
        }
    }
    

    func applicationDidFinishLaunching() {
        print("ExtentionDelegate applicationDidFinishLaunching")
        // Perform any final initialization of your application.
    }

    func applicationDidBecomeActive() {
        print("ExtentionDelegate applicationDidBecomeActive")
        bluenetManager.start()
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillResignActive() {
        print("ExtentionDelegate applicationWillResignActive")
        bluenetManager.pause()
        
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions
        // (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, etc.
    }

    func handle(_ backgroundTasks: Set<WKRefreshBackgroundTask>) {
        // Sent when the system needs to launch the application in the background to process tasks. Tasks arrive in a set, so loop through and process each one.
        for task in backgroundTasks {
            // Use a switch statement to check the task type
            switch task {
            case let backgroundTask as WKApplicationRefreshBackgroundTask:
                // Be sure to complete the background task once you’re done.
                backgroundTask.setTaskCompletedWithSnapshot(false)
            case let snapshotTask as WKSnapshotRefreshBackgroundTask:
                // Snapshot tasks have a unique completion call, make sure to set your expiration date
                snapshotTask.setTaskCompleted(restoredDefaultState: true, estimatedSnapshotExpiration: Date.distantFuture, userInfo: nil)
            case let connectivityTask as WKWatchConnectivityRefreshBackgroundTask:
                // Be sure to complete the connectivity task once you’re done.
                connectivityTask.setTaskCompletedWithSnapshot(false)
            case let urlSessionTask as WKURLSessionRefreshBackgroundTask:
                // Be sure to complete the URL session task once you’re done.
                urlSessionTask.setTaskCompletedWithSnapshot(false)
            case let relevantShortcutTask as WKRelevantShortcutRefreshBackgroundTask:
                // Be sure to complete the relevant-shortcut task once you're done.
                relevantShortcutTask.setTaskCompletedWithSnapshot(false)
            case let intentDidRunTask as WKIntentDidRunRefreshBackgroundTask:
                // Be sure to complete the intent-did-run task once you're done.
                intentDidRunTask.setTaskCompletedWithSnapshot(false)
            default:
                // make sure to complete unhandled task types
                task.setTaskCompletedWithSnapshot(false)
            }
        }
    }

}
